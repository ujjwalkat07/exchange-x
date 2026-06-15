import {
  Wallet,
  ApiErrorHandling,
  ApiResponse,
  HttpCodes,
  AuthRequest,
  Response,
} from "./export";

export const updateUserBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userid = req.user?._id;
    const balance = 10000;
    if (!userid) {
      throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "Unauthorized");
    }
    //check if balance is full or not
    const wallet = await Wallet.findOne({ user: userid });

    if (!wallet || null) {
      throw new ApiErrorHandling(
        HttpCodes.NOT_FOUND,
        "Wallet not found. Create wallet first",
      );
    }

    if (!(wallet.balance < balance)) {
      throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "wallet already fill");
    }
    //update wallet balance
    const user = await Wallet.findOneAndUpdate(
      { user: userid },
      {
        balance: balance,
      },
      { new: true },
    );

    res
      .status(HttpCodes.OK)
      .json(
        new ApiResponse(
          HttpCodes.OK,
          { user },
          "user balance updated successfully",
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
