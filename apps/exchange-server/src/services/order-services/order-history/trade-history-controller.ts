import {
  ApiErrorHandling,
  ApiResponse,
  AuthRequest,
  HttpCodes,
  Response,
} from "../place-orders/orders-controllers/export";
import { orderHistory } from "./trade-history-model";

export const tradeHistoryController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiErrorHandling(
        HttpCodes.UNAUTHORIZED,
        "User not authenticated"
      );
    }

    const result = await orderHistory
      .find({
        $or: [
          { buyerUserId: userId },
          { sellerUserId: userId },
        ],
      }).lean();

    const formattedTrades = result.map((trade) => {
      const isBuyer = trade.buyerUserId.toString() === userId.toString();
      return {
        ...trade,
        orderSide: isBuyer ? "BUY" : "SELL",
        orderId: isBuyer ? trade.buyerOrderId : trade.sellerOrderId,
      };
    });

    return res.status(HttpCodes.OK).json(
      new ApiResponse(
        HttpCodes.OK,
        formattedTrades,
        "Trade history fetched successfully"
      )
    );
  } catch (error) {
    console.log(error)
    if (error instanceof ApiErrorHandling) {
      return res
        .status(error.statusCode)
        .json(new ApiResponse(error.statusCode, null, error.message));
    }
    return res.status(HttpCodes.INTERNAL_SERVER_ERROR).json(
      new ApiResponse(
        HttpCodes.INTERNAL_SERVER_ERROR,
        null,
        "Internal Server Error"
      )
    );
  }
};
