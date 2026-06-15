import {
  Wallet,
  ApiErrorHandling,
  ApiResponse,
  HttpCodes,
  AuthRequest,
  Response,
  Redis,
} from "./export";

export const getUserBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userid = req.user?._id;
    if (!userid) {
      throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "UNAUTHORIZED");
    }

    const { asset1, asset2 } = req.query;
    // console.log(req.query)
    if (!asset1 || !asset2) {
      throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "asset1 and asset2 are required");
    }

    const redisKey = `wallet:${userid}`;

    // Get both balances in ONE redis call
    const [cached1, cached2] = await Redis.getClient().hmGet(redisKey, [
      asset1 as string,
      asset2 as string,
    ]);

    if (cached1 && cached2) {
      return res
        .status(HttpCodes.OK)
        .json(
          new ApiResponse(
            HttpCodes.OK,
            { asset1: cached1, asset2: cached2 },
            "wallet balance (cache)",
          ),
        );
    }

    // Fetch both wallets in ONE DB query
    const wallets = await Wallet.find(
      { $or: [{ asset: asset1, user: userid }, { asset: asset2, user: userid }] },
      { asset: 1, balance: 1 }
    ).lean();

    if (!wallets || wallets.length === 0) {
      throw new ApiErrorHandling(HttpCodes.NOT_FOUND, "Wallets not found");
    }

    const wallet1 = wallets.find((w) => w.asset === asset1);
    const wallet2 = wallets.find((w) => w.asset === asset2);

    if (!wallet1) {
      throw new ApiErrorHandling(HttpCodes.NOT_FOUND, `Wallet not found for ${asset1}`);
    }

    const balance1 = wallet1.balance;
    const balance2 = wallet2?.balance;

    // Store both balances in ONE redis call
    await Redis.getClient().hSet(redisKey, {
      [asset1 as string]: Number(balance1),
      [asset2 as string]: Number(balance2) >= 0 ? Number(balance2) : NaN,
    });

    return res
      .status(HttpCodes.OK)
      .json(
        new ApiResponse(
          HttpCodes.OK,
          { asset1: balance1, asset2: balance2 },
          "user wallet balances",
        ),
      );
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
