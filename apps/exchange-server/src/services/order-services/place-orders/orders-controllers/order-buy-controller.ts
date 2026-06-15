import {
  ApiErrorHandling,
  AuthRequest,
  HttpCodes,
  IBuyRequestBody,
  Response,
  Redis,
  ApiResponse,
  Kafka,
  Wallet,
  getLatestPrice,
} from "./export";
import { v4 as uuidv4 } from "uuid";

export const buyOrder = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const uuid = uuidv4();
    const {
      currencyPair,
      orderSide,
      orderType,
      positionStatus,
      orderAmount,
    }: IBuyRequestBody = req.body;

    //fetch userid from middleware
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

    //calculate qty so that it can use as globally
    const orderQuantity = orderAmount / livePrice;

    const redisKey = `wallet:${userId}`;

    //console.time("redis-get-wallet");
    const wallet = await Redis.getClient().hGet(redisKey, "USDT");
    //console.timeEnd("redis-get-wallet");
    let walletBalance = Number(wallet);

    if (walletBalance === 0) {
      const walletDB = await Wallet.findOne({
        user: userId,
        asset: "USDT",
      }).lean();

      if (!walletDB) {
        throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "wallet not created");
      }

      walletBalance = Number(walletDB.balance);
      //push cached wallet to redis

      const field = "USDT";
      await Redis.getClient().hSet(redisKey, {
        [field]: walletBalance,
      });
    }

    if (orderAmount > walletBalance) {
      throw new ApiErrorHandling(
        HttpCodes.BAD_REQUEST,
        "Insufficient USDT balance",
      );
    }
    const buyOrder = {
      user: userId.toString(),
      orderId: uuid,
      orderSide,
      currencyPair: currencyPair,
      orderType,
      entryPrice: livePrice.toString(),
      positionStatus,
      orderAmount: orderAmount.toString(),
      orderQuantity: orderQuantity.toString(),
    };

    //push to kafka
    //console.time("kafka-send");
    Kafka.sendToConsumer(
      currencyPair,
      "orders-detail",
      JSON.stringify(buyOrder),
    );
    //console.timeEnd("kafka-send");

    //push to redis
    //console.time("redis-pipeline");

    const pipeline = Redis.getClient().multi();
    pipeline.hSet(`orderdetail:orderID:${uuid}`, buyOrder);
    pipeline.expire(`orderdetail:orderID:${uuid}`, 50000); //set expiry of 5000 seconds
    pipeline.sAdd(`openOrders:userId:${userId}`, uuid);
    pipeline.expire(`openOrders:userId:${userId}`, 50000);
    await pipeline.exec();
    //console.timeEnd("redis-pipeline");
    req.app.locals.emit("order", "Order Placed Successfully");

    return res
      .status(HttpCodes.OK)
      .json(
        new ApiResponse(HttpCodes.OK, buyOrder, "Trade placed successfully"),
      );
  } catch (error) {
    console.log(error);
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
