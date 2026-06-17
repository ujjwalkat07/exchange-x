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
} from "./export";
import { v4 as uuidv4 } from "uuid";

const getWalletBalance = async (
  userId: string,
  walletAsset: string,
): Promise<number> => {
  const redisKey = `wallet:${userId}`;
  const wallet = await Redis.getClient().hGet(redisKey, walletAsset);

  if (wallet === null || wallet === undefined) {
    // Cache miss — fetch from DB and flush to redis
    const walletDB = await Wallet.findOne({
      user: userId,
      asset: walletAsset,
    }).lean();

    if (!walletDB) {
      throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "Wallet not created");
    }

    const balance = Number(walletDB.balance);
    await Redis.getClient().hSet(redisKey, { [walletAsset]: balance });
    return balance;
  }

  return Number(wallet);
};
const getLockedBalance = async (userId: string, asset: string): Promise<boolean> => {
  const result = await Redis.getClient().set(
    `lock:wallet:${userId}:${asset}`,
    "1",
    { NX: true, PX: 100},
  );
  return result === "OK";
};

const releaseLockedBalance = async (userId: string, asset: string): Promise<void> => {
  await Redis.getClient().del(`lock:wallet:${userId}:${asset}`);
};

// Read the best available price from the order book in Redis
// For BUY orders: best (lowest) ask from the SELL side
// For SELL orders: best (highest) bid from the BUY side
//Its only for market orders 
const getBestBookPrice = async (
  currencyPair: string,
  orderSide: "BUY" | "SELL",
): Promise<number | null> => {
  const oppositeBook =
    orderSide === "BUY"
      ? `orderbook:${currencyPair}:SELL`
      : `orderbook:${currencyPair}:BUY`;

  // For BUY: get lowest ask (index 0, ascending).
  // For SELL: get highest bid (index 0, descending via REV).
  const best =
    orderSide === "BUY"
      ? await Redis.getClient().zRangeWithScores(oppositeBook, 0, 0)
      : await Redis.getClient().zRangeWithScores(oppositeBook, 0, 0, { REV: true });

  if (!best || best.length === 0) return null;
  return best[0].score;
};


const createOrder = async (
  req: AuthRequest,
  res: Response,
  orderSide: "BUY" | "SELL"
): Promise<Response> => {
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
  let walletBalance: number;
  let walletAsset = orderSide === "BUY" ? "USDT" : currencyPairUpper.replace("USDT", "");

  //to prevent the concurrent order running in parallel due to slow intenet/network it stop the other order to run for 5 seconds
  const locked = await getLockedBalance(userId.toString(), walletAsset);
  if (!locked) {
    return res
      .status(HttpCodes.TOO_MANY_REQUESTS)
      .json(
        new ApiResponse(
          HttpCodes.TOO_MANY_REQUESTS,
          null,
          "Another order is already being processed. Please wait a moment.",
        ),
      );
  }
  try {
    if (orderType === "Limit") {
      if (!entryPrice || Number(entryPrice) <= 0) {
        throw new ApiErrorHandling(
          HttpCodes.BAD_REQUEST,
          "Limit price (entryPrice) is required and must be greater than 0",
        );
      }
      price = Number(entryPrice);
      walletBalance = await getWalletBalance(userId.toString(), walletAsset);
    } else {
      // Market order: use the best available price from our own order book
      const [bookPrice, balance] = await Promise.all([
        getBestBookPrice(currencyPairUpper, orderSide),
        getWalletBalance(userId.toString(), walletAsset),
      ]);
      if (!bookPrice) {
        throw new ApiErrorHandling(
          HttpCodes.SERVICE_UNAVAILABLE,
          "No liquidity available in the order book. Please try again later.",
        );
      }
      walletBalance = balance;
      price = bookPrice;
    }

    let orderAmount: number;
    let orderQuantity: number;
    let balanceToCheck: number;

    if (orderSide === "BUY") {
      const body = req.body as IBuyRequestBody;
      orderAmount = Number(body.orderAmount);
      if (!orderAmount || orderAmount <= 0) {
        throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "Amount is required and must be greater than 0");
      }
      orderQuantity = orderAmount / price;
      balanceToCheck = orderAmount;
    } else {
      const body = req.body as ISellRequestBody;
      orderQuantity = Number(body.orderQuantity);
      if (!orderQuantity || orderQuantity <= 0) {
        throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "Quantity is required and must be greater than 0");
      }
      orderAmount = orderQuantity * price;
      balanceToCheck = orderQuantity;
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
  } finally {
    // release the lock so that next order is allowed to run
    await releaseLockedBalance(userId.toString(), walletAsset);
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
