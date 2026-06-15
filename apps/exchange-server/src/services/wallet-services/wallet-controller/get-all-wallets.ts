import {
    Wallet,
    ApiErrorHandling,
    ApiResponse,
    HttpCodes,
    AuthRequest,
    Response,
    Redis,
} from "./export";

export const getAllWallets = async (req: AuthRequest, res: Response) => {
    try {
        const userid = req.user?._id;
        if (!userid) {
            throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "UNAUTHORIZED");
        }

        const redisKey = `all:wallet:${userid}`;

        const cachedData = await Redis.getClient().json.get(redisKey);

        if (cachedData) {
            return res
                .status(HttpCodes.OK)
                .json(
                    new ApiResponse(
                        HttpCodes.OK,
                        { wallets: cachedData },
                        "wallet balance (cache)",
                    ),
                );
        }

        const wallets = await Wallet.find({ user: userid }, { asset: 1, balance: 1, _id: 0 }).lean();

        if (!wallets || wallets.length === 0) {
            throw new ApiErrorHandling(HttpCodes.NOT_FOUND, "Wallets not found");
        }

        await Redis.getClient().json.set(redisKey, "$", wallets as any);
        await Redis.getClient().expire(redisKey, 60 * 5);

        return res
            .status(HttpCodes.OK)
            .json(
                new ApiResponse(
                    HttpCodes.OK,
                    { wallets },
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