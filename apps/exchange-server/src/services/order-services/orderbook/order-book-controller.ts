import {
  ApiErrorHandling,
  ApiResponse,
  HttpCodes,
  Redis,
} from "../place-orders/orders-controllers/export";
import {
  Response,
  AuthRequest,
} from "../place-orders/orders-controllers/export";

export const buyOrderBook = async (req: AuthRequest, res: Response) => {
  try {
    const param = req.params.currencyPair;
    const book = await Redis.getClient().zRangeWithScores(
      `orderbook:${param}:BUY`,
      0,
      10,
    );
    return res.status(200).json({ book });
  } catch (error) {
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

export const sellOrderBook = async (req: AuthRequest, res: Response) => {
  try {
    const param = req.params.currencyPair;
    const book = await Redis.getClient().zRangeWithScores(
      `orderbook:${param}:SELL`,
      0,
      10,
    );
    return res.status(200).json({ book });
  } catch (error) {
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
