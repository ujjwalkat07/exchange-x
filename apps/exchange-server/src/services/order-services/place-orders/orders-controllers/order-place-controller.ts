import {
  ApiErrorHandling,
  AuthRequest,
  HttpCodes,
  IBuyRequestBody,
  ISellRequestBody,
  Response,
  Redis,
  ApiResponse,
  Kafka,
  Wallet,
  getLatestPrice,
} from "./export";
import { v4 as uuidv4 } from "uuid";

const createOrder = async (
  req: AuthRequest,
  res: Response,
  orderSide: "BUY" | "SELL"
): Promise<Response> => {
  try {
    const uuid = uuidv4();
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiErrorHandling(HttpCodes.UNAUTHORIZED, "User not authenticated");
    }

    const {
      currencyPair,
      orderType,
      positionStatus,
      entryPrice,
    } = req.body;

    const currencyPairUpper = String(currencyPair).toUpperCase();

    let price: number;
    if (orderType === "Limit") {
      if (!entryPrice || Number(entryPrice) <= 0) {
        throw new ApiErrorHandling(
          HttpCodes.BAD_REQUEST,
          "Limit price (entryPrice) is required and must be greater than 0",
        );
      }
      price = Number(entryPrice);
    } else {
      const livePrice = await getLatestPrice(currencyPairUpper);
      if (!livePrice) {
        throw new ApiErrorHandling(
          HttpCodes.SERVICE_UNAVAILABLE,
          "Live mark price unavailable. Please retry in a moment",
        );
      }
      price = livePrice;
    }

    let orderAmount: number;
    let orderQuantity: number;
    let balanceToCheck: number;
    let walletAsset: string;

    if (orderSide === "BUY") {
      const body = req.body as IBuyRequestBody;
      orderAmount = Number(body.orderAmount);
      if (!orderAmount || orderAmount <= 0) {
        throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "orderAmount is required and must be greater than 0");
      }
      orderQuantity = orderAmount / price;
      balanceToCheck = orderAmount;
      walletAsset = "USDT";
    } else {
      const body = req.body as ISellRequestBody;
      orderQuantity = Number(body.orderQuantity);
      if (!orderQuantity || orderQuantity <= 0) {
        throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "orderQuantity is required and must be greater than 0");
      }
      orderAmount = orderQuantity * price;
      balanceToCheck = orderQuantity;
      walletAsset = currencyPairUpper.replace("USDT", "");
    }

    const redisKey = `wallet:${userId}`;
    const wallet = await Redis.getClient().hGet(redisKey, walletAsset);
    let walletBalance = Number(wallet);

    if (walletBalance === 0) {
      const walletDB = await Wallet.findOne({
        user: userId,
        asset: walletAsset,
      }).lean();

      if (!walletDB) {
        throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "wallet not created");
      }

      walletBalance = Number(walletDB.balance);
      await Redis.getClient().hSet(redisKey, {
        [walletAsset]: walletBalance,
      });
    }

    if (balanceToCheck > walletBalance) {
      throw new ApiErrorHandling(
        HttpCodes.BAD_REQUEST,
        orderSide === "BUY" ? "Insufficient USDT balance" : "Insufficient Token balance",
      );
    }

    const placedOrder = {
      user: userId.toString(),
      orderId: uuid,
      orderSide,
      currencyPair: currencyPairUpper,
      orderType,
      entryPrice: price.toString(),
      positionStatus,
      orderAmount: orderAmount.toString(),
      orderQuantity: orderQuantity.toString(),
    };

    // Push to Kafka
    Kafka.sendToConsumer(
      currencyPairUpper,
      "orders-detail",
      JSON.stringify(placedOrder),
    );

    // Push to Redis
    const pipeline = Redis.getClient().multi();
    pipeline.hSet(`orderdetail:orderID:${uuid}`, placedOrder);
    pipeline.expire(`orderdetail:orderID:${uuid}`, 50000);
    pipeline.sAdd(`openOrders:userId:${userId}`, uuid);
    pipeline.expire(`openOrders:userId:${userId}`, 50000);
    await pipeline.exec();

    req.app.locals.emit("order", "Order Placed Successfully");

    return res
      .status(HttpCodes.OK)
      .json(
        new ApiResponse(
          HttpCodes.OK,
          placedOrder,
          orderSide === "BUY" ? "Trade placed successfully" : "Sell order executed"
        )
      );
  } catch (error) {
    console.error(`Place ${orderSide} order error:`, error);
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

export const buyOrder = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  return createOrder(req, res, "BUY");
};

export const sellOrder = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  return createOrder(req, res, "SELL");
};
