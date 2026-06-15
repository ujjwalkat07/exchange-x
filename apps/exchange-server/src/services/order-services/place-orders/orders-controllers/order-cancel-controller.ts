import {
  ApiErrorHandling,
  ApiResponse,
  AuthRequest,
  HttpCodes,
  Order,
  Redis,
  Response,
  Wallet,
} from "./export";

export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "Unauthorized");
    }

    const { orderId } = req.body;
    if (!orderId) {
      throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "orderId is required");
    }

    // Find the order in MongoDB
    const order = await Order.findOne({
      orderId,
      user: userId,
      positionStatus: "Open",
    });

    if (!order) {
      throw new ApiErrorHandling(
        HttpCodes.NOT_FOUND,
        "Open order not found or already executed/cancelled"
      );
    }

    const redis = Redis.getClient();

    // 1. Remove from Redis Orderbook Sorted Set
    const bookSide = order.orderSide; // "BUY" or "SELL"
    const orderbookKey = `orderbook:${order.currencyPair}:${bookSide}`;
    
    // The member value in sorted set is: `${userId}|${orderId}|${orderQuantity}`
    // Let's construct it
    const memberValue = `${userId.toString()}|${orderId}|${order.orderQuantity}`;
    await redis.zRem(orderbookKey, memberValue);

    // 2. Refund User Wallet
    if (order.orderSide === "BUY") {
      // Refund remaining orderAmount in USDT
      const refundAmount = order.orderQuantity * order.entryPrice;
      await Wallet.updateOne(
        { user: userId, asset: "USDT" },
        { $inc: { balance: refundAmount } }
      );
    } else {
      // Refund remaining orderQuantity in asset token (e.g. BTC)
      const tokenAsset = order.currencyPair.toUpperCase().replace("USDT", "");
      await Wallet.updateOne(
        { user: userId, asset: tokenAsset },
        { $inc: { balance: order.orderQuantity } }
      );
    }

    // Clear user's wallet cache in Redis
    await redis.del(`wallet:${userId}`);

    // 3. Delete from user's open orders and order details in Redis
    await Promise.all([
      redis.sRem(`openOrders:userId:${userId}`, orderId),
      redis.del(`orderdetail:orderID:${orderId}`),
    ]);

    // 4. Update order status in DB to "Cancelled"
    order.positionStatus = "Cancelled";
    await order.save();

    // 5. Emit socket event to notify frontend of changes
    req.app.locals.emit("order", "Order Cancelled Successfully");
    req.app.locals.emit("wallet", "Wallet Updated Successfully");

    return res
      .status(HttpCodes.OK)
      .json(new ApiResponse(HttpCodes.OK, order, "Order cancelled successfully"));

  } catch (error) {
    console.error("Cancel order error:", error);
    if (error instanceof ApiErrorHandling) {
      return res
        .status(error.statusCode)
        .json(new ApiResponse(error.statusCode, null, error.message));
    } else {
      return res
        .status(HttpCodes.INTERNAL_SERVER_ERROR)
        .json(
          new ApiResponse(
            HttpCodes.INTERNAL_SERVER_ERROR,
            null,
            "Internal Server Error",
          ),
        );
    }
  }
};
