import {
  ApiErrorHandling,
  ApiResponse,
  AuthRequest,
  HttpCodes,
  Redis,
  Response,
} from "../orders-controllers/export";

export const getRestingOrders = async (
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

    if (!orderIds || orderIds.length === 0 || orderIds[0] == null) {
      return res
        .status(HttpCodes.OK)
        .json(new ApiResponse(HttpCodes.OK, [], "No resting orders"));
    }

    // Retrieve order details for each ID
    const restingOrders = await Promise.all(
      orderIds.map(async (id) => {
        return await redis.hGetAll(`orderdetail:orderID:${id}`);
      }),
    );

    // Filter out any empty hashes just in case of race conditions
    const validOrders = restingOrders.filter((order) => order && order.orderId);

    return res
      .status(HttpCodes.OK)
      .json(new ApiResponse(HttpCodes.OK, validOrders, "Resting open orders directly from Redis"));
  } catch (error) {
    console.error("getRestingOrders error:", error);
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
