import {
  Wallet,
  ApiErrorHandling,
  ApiResponse,
  HttpCodes,
  AuthRequest,
  Response,
  Redis,
} from "./export";

export const updateUserBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userid = req.user?._id;
    const balance = 10000;
    if (!userid) {
      throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "Unauthorized");
    }
    //check if balance is full or not
    const wallet = await Wallet.findOne({ user: userid, asset: "USDT" });

    if (!wallet) {
      throw new ApiErrorHandling(
        HttpCodes.NOT_FOUND,
        "Wallet not found. Create wallet first",
      );
    }
    console.log(wallet)
    if (!(wallet.balance < balance)) {
      throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "wallet already fill");
    }
    //update wallet balance
    const user = await Wallet.findOneAndUpdate(
      { user: userid, asset: "USDT" },
      {
        balance: balance,
      },
      { new: true },
    );

    // Clear Redis wallet caches
    const redis = Redis.getClient();
    await Promise.all([
      redis.del(`wallet:${userid}`),
      redis.del(`all:wallet:${userid}`),
    ]);

    // Emit socket event to refresh frontend
    req.app.locals.emit("wallet", "Wallet Updated Successfully");

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
