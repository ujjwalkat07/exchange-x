import {
  ApiErrorHandling,
  ApiResponse,
  AuthRequest,
  HttpCodes,
  Order,
  Redis,
  Response,
  Wallet,
  getLatestPrice,
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

    // Find the order in MongoDB (can be resting Open or executed Filled position)
    const order = await Order.findOne({
      orderId,
      user: userId,
      positionStatus: { $in: ["Open", "Filled"] },
    });

    if (!order) {
      throw new ApiErrorHandling(
        HttpCodes.NOT_FOUND,
        "Order or position not found"
      );
    }

    const redis = Redis.getClient();

    if (order.positionStatus === "Open") {
      // 1. Remove from Redis Orderbook Sorted Set
      const bookSide = order.orderSide; // "BUY" or "SELL"
      const orderbookKey = `orderbook:${order.currencyPair}:${bookSide}`;
      
      // The member value in sorted set is: `${userId}|${orderId}|${orderQuantity}`
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

      // 3. Delete from user's open orders and order details in Redis, and invalidate closed orders cache
      await Promise.all([
        redis.sRem(`openOrders:userId:${userId}`, orderId),
        redis.del(`orderdetail:orderID:${orderId}`),
        redis.del(`closeOrders:userId:${userId}`),
      ]);

      // 4. Update order status in DB to "Cancelled"
      order.positionStatus = "Cancelled";
      await order.save();

      // 5. Emit socket events to notify frontend
      req.app.locals.emit("order", "Order Cancelled Successfully");
      req.app.locals.emit("wallet", "Wallet Updated Successfully");

      return res
        .status(HttpCodes.OK)
        .json(new ApiResponse(HttpCodes.OK, order, "Order cancelled successfully"));

    } else {
      // positionStatus === "Filled" -> Close Active Position
      let currentPrice = order.entryPrice;
      try {
        currentPrice = await getLatestPrice(order.currencyPair);
      } catch (err) {
        console.error("Failed to fetch live price for closing position, falling back to entryPrice:", err);
      }

      const tokenAsset = order.currencyPair.toUpperCase().replace("USDT", "");

      // Execute Close transaction:
      if (order.orderSide === "BUY") {
        // Long Position: deduct token asset from user, credit equivalent USDT
        await Wallet.updateOne(
          { user: userId, asset: tokenAsset },
          { $inc: { balance: -order.orderQuantity } }
        );
        await Wallet.updateOne(
          { user: userId, asset: "USDT" },
          { $inc: { balance: order.orderQuantity * currentPrice } }
        );
      } else {
        // Short Position: credit token asset to user, deduct equivalent USDT
        await Wallet.updateOne(
          { user: userId, asset: tokenAsset },
          { $inc: { balance: order.orderQuantity } }
        );
        await Wallet.updateOne(
          { user: userId, asset: "USDT" },
          { $inc: { balance: -(order.orderQuantity * currentPrice) } }
        );
      }

      // Clear user's wallet cache in Redis
      await redis.del(`wallet:${userId}`);

      // 3. Delete from user's open orders and order details in Redis (as it is no longer open), and invalidate closed positions cache
      await Promise.all([
        redis.sRem(`openOrders:userId:${userId}`, orderId),
        redis.del(`orderdetail:orderID:${orderId}`),
        redis.del(`closeOrders:userId:${userId}`),
      ]);

      // Update position status to Closed in DB
      order.positionStatus = "Closed";
      await order.save();

      // Emit socket events
      req.app.locals.emit("order", "Position Closed Successfully");
      req.app.locals.emit("wallet", "Wallet Updated Successfully");

      return res
        .status(HttpCodes.OK)
        .json(new ApiResponse(HttpCodes.OK, order, "Position closed successfully"));
    }

  } catch (error) {
    console.error("Cancel/Close order error:", error);
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
