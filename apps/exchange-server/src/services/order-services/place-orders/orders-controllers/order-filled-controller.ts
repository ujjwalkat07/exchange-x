import {
  ApiErrorHandling,
  ApiResponse,
  AuthRequest,
  HttpCodes,
  Order,
  Response,
} from "./export";
import { orderHistory } from "../../order-history/trade-history-model";

export const openPosition = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "Unauthorized");
    }

    const orders = await Order.find({
      user: userId,
      positionStatus: "Filled",
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    const matchedOrders = [];
    for (const order of orders) {
      const hasTrades = await orderHistory.exists({
        $or: [
          { buyerOrderId: order.orderId },
          { sellerOrderId: order.orderId },
        ],
      });
      if (hasTrades) {
        matchedOrders.push(order);
      }
    }

    return res
      .status(HttpCodes.OK)
      .json(new ApiResponse(HttpCodes.OK, matchedOrders, "Open positions (matched orders)"));
  } catch (error) {
    console.error("openPosition error:", error);
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
