import {
  ApiErrorHandling,
  ApiResponse,
  AuthRequest,
  HttpCodes,
  Order,
  Redis,
  Response,
} from "../orders-controllers/export";

export const openPosition = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "Unauthorized");
    }

    const redis = Redis.getClient();

    const orderIds = await redis.sMembers(
      `openOrders:userId:${userId}`
    );
    // console.log(orderIds[0])
    if (orderIds.length > 0 || orderIds[0] != null) {
      const result = await Promise.all(
        orderIds.map((Id) => {
          return redis.hGetAll(`orderdetail:orderID:${Id}`);
        }),
      );

      return res
        .status(HttpCodes.OK)
        .json(new ApiResponse(HttpCodes.OK, result, "Live trades from redis"));
    }

    const orders = await Order.find({
      user: userId,
      positionStatus: "Open",
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    //push to Redis
    const pipeline = redis.multi();

    orders.forEach(async (order) => {
      const orderId = order.orderId;
      await Promise.all([
        pipeline.hSet(`orderdetail:orderID:${orderId}`, {
          orderId: order.orderId,
          user: order.user.toString(),
          currencyPair: order.currencyPair,
          orderSide: order.orderSide,
          orderType: order.orderType,
          entryPrice: order.entryPrice.toString(),
          orderAmount: order.orderAmount.toString(),
          orderQuantity: order.orderQuantity.toString(),
          positionStatus: order.positionStatus,
        }),
        pipeline.expire(`orderdetail:orderID:${orderId}`, 50000),
        pipeline.sAdd(`openOrders:userId:${order.user}`, orderId),
        pipeline.expire(`openOrders:userId:${order.user}`, 50000),
      ]);
    });

    await pipeline.exec();

    return res
      .status(HttpCodes.OK)
      .json(new ApiResponse(HttpCodes.OK, orders, "Live from DB trades"));
  } catch (error) {
    console.log(error)
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
