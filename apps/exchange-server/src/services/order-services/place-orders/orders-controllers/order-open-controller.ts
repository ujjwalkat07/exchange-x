import {
  ApiErrorHandling,
  ApiResponse,
  AuthRequest,
  HttpCodes,
  Redis,
  Response,
  Order,
} from "./export";

export const getOpenOrders = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "Unauthorized");
    }

    const redis = Redis.getClient();

    // Fetch open order IDs from Redis Set for this user
    const orderIds = await redis.sMembers(`openOrders:userId:${userId}`);

    if (orderIds && orderIds.length > 0 && orderIds[0] != null) {
      // Retrieve order details for each ID
      const restingOrders = await Promise.all(
        orderIds.map(async (id) => {
          return await redis.hGetAll(`orderdetail:orderID:${id}`);
        }),
      );

      // Filter out any empty hashes just in case of race conditions
      const validOrders = restingOrders.filter((order) => order && order.orderId);

      if (validOrders.length > 0) {
        return res
          .status(HttpCodes.OK)
          .json(new ApiResponse(HttpCodes.OK, validOrders, "Resting open orders directly from Redis"));
      }
    }

    // If Redis has no open orders for the user, query MongoDB
    const orders = await Order.find({
      user: userId,
      positionStatus: "Open",
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    // If open orders are found in MongoDB, populate the Redis cache
    if (orders.length > 0) {
      const pipeline = redis.multi();

      for (const order of orders) {
        const orderId = order.orderId;
        pipeline.hSet(`orderdetail:orderID:${orderId}`, {
          orderId: order.orderId,
          userId: order.user.toString(),
          currencyPair: order.currencyPair,
          orderSide: order.orderSide,
          orderType: order.orderType,
          entryPrice: order.entryPrice.toString(),
          orderAmount: order.orderAmount.toString(),
          orderQuantity: order.orderQuantity.toString(),
          positionStatus: order.positionStatus,
        });
        pipeline.expire(`orderdetail:orderID:${orderId}`, 50000);
        pipeline.sAdd(`openOrders:userId:${order.user}`, orderId);
        pipeline.expire(`openOrders:userId:${order.user}`, 50000);
      }

      await pipeline.exec();
    }

    return res
      .status(HttpCodes.OK)
      .json(new ApiResponse(HttpCodes.OK, orders, "Open orders retrieved from Database"));
  } catch (error) {
    console.error("getOpenOrders error:", error);
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
