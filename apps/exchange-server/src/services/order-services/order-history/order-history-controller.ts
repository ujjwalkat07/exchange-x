import {
  ApiErrorHandling,
  ApiResponse,
  AuthRequest,
  HttpCodes,
  Response,
} from "../place-orders/orders-controllers/export";
import { orderHistory } from "./order-history-model";

export const orderHistoryController = async (
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

    return res.status(HttpCodes.OK).json(
      new ApiResponse(
        HttpCodes.OK,
        result,
        "Order history fetched successfully"
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
