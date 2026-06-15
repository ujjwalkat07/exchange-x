import {
  Wallet,
  ApiErrorHandling,
  ApiResponse,
  HttpCodes,
  AuthRequest,
  Response,
} from "./export";

export const createWallet = async (req: AuthRequest, res: Response) => {
  try {
    const userid = req.user?._id;
    if (!userid) {
      throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "UNAUTHORIZED");
    }

    const existingWallet = await Wallet.findOne({ user: userid });

    if (existingWallet) {
      throw new ApiErrorHandling(HttpCodes.CONFLICT, "wallet already exist");
    }

    const userWallet = await Wallet.create({
      user: userid,
      asset: "USDT",
      balance: 10000,
    });

    res
      .status(HttpCodes.CREATED)
      .json(
        new ApiResponse(
          HttpCodes.CREATED,
          { userWallet },
          "wallet created successfully",
        ),
      );
  } catch (error) {
    if (error instanceof ApiErrorHandling) {
      res
        .status(error.statusCode)
        .json(new ApiResponse(error.statusCode, null, error.message));
    } else {
      res
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
