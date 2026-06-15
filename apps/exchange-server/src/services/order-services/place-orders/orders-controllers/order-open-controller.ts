import {
  ApiErrorHandling,
  ApiResponse,
  AuthRequest,
  HttpCodes,
  Order,
  Response,
} from "../orders-controllers/export";
import { orderHistory } from "../../order-history/order-history-model";

export const openPosition = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "Unauthorized");
    }

    // Find all open orders for this user
    const orders = await Order.find({
      user: userId,
      positionStatus: "Open",
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    // Filter to keep ONLY orders that have matched trades (positions)
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
