import {
  ApiErrorHandling,
  ApiResponse,
  AuthRequest,
  HttpCodes,
  ISellRequestBody,
  Wallet,
  Response,
  Kafka,
  Redis,
  getLatestPrice,
} from "./export";
import { v4 as uuidv4 } from "uuid";

export const sellOrder = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const uuid = uuidv4();
    const {
      currencyPair,
      orderType,
      orderSide,
      positionStatus,
      orderQuantity,
    }: ISellRequestBody = req.body;
    // const asset = req.params.asset;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiErrorHandling(
        HttpCodes.UNAUTHORIZED,
        "User not authenticated",
      );
    }
    const livePrice = await getLatestPrice(currencyPair);

    if (!livePrice) {
      throw new ApiErrorHandling(
        HttpCodes.SERVICE_UNAVAILABLE,
        "Live mark price unavailable. Please retry in a moment",
      );
    }

    const totalAmount = orderQuantity * livePrice;

    const redisKey = `wallet:${userId}`;
    const wallet = await Redis.getClient().hGet(
      redisKey,
      currencyPair.toUpperCase().replace("USDT", ""),
    );

    let walletBalance = Number(wallet);
    if (walletBalance === 0) {
      //fetch from DB
      // console.time("db-fetch");
      const walletDB = await Wallet.findOne({
        user: userId,
        asset: currencyPair.toUpperCase().replace("USDT", ""),
      }).lean();
      // console.timeEnd("db-fetch");
      if (!walletDB) {
        throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "wallet not created");
      }
      //push to redis
      walletBalance = Number(walletDB.balance);
      //push cached wallet to redis
      const field = currencyPair.toUpperCase().replace("USDT", "");
      await Redis.getClient().hSet(redisKey, {
        [field]: walletBalance,
      });
    }

    if (orderQuantity > walletBalance) {
      throw new ApiErrorHandling(
        HttpCodes.BAD_REQUEST,
        "Insufficient Token balance",
      );
    }
    const sellOrder = {
      user: userId.toString(),
      orderId: uuid,
      orderSide,
      currencyPair: currencyPair,
      orderType,
      entryPrice: livePrice.toString(),
      positionStatus,
      orderAmount: totalAmount.toString(),
      orderQuantity: orderQuantity.toString(),
    };

    //push to kafka
    Kafka.sendToConsumer(
      currencyPair,
      "orders-detail",
      JSON.stringify(sellOrder),
    );

    //push to redis
    const pipeline = Redis.getClient().multi();
    pipeline.hSet(`orderdetail:orderID:${uuid}`, sellOrder);
    pipeline.expire(`orderdetail:orderID:${uuid}`, 5000);
    pipeline.sAdd(`openOrders:userId:${userId}`, uuid);
    await pipeline.exec();
    req.app.locals.emit("order", "Order Placed Successfully");
    return res
      .status(HttpCodes.OK)
      .json(new ApiResponse(HttpCodes.OK, sellOrder, "Sell order executed"));
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
