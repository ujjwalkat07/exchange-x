export { openPosition } from "./order-open-controller";
export { sellOrder } from "./order-sell-controller";
export { buyOrder } from "./order-buy-controller";

export { Redis } from "../../../../config/redis-config/redis-connection";
export { Kafka } from "../../../../config/kafka-config/kafka-producer"
export { Order } from "../order-model";
export { Response } from "express";
export { Wallet } from "../../../wallet-services/wallet-model";
export {
  ApiErrorHandling,
  ApiResponse,
  HttpCodes,
} from "../../../../utils/utils-export";
export { AuthRequest } from "../../../../middleware/jwt-verify";
export { getLatestPrice } from "../../../../websockets/price-fetch";

export interface IBuyRequestBody {
  currencyPair: string;
  orderType: "market";
  entryPrice?: number;
  positionStatus: "open" | "closed";
  orderAmount: number;
  orderSide: "BUY" | "SELL"; // USDT
}

export interface ISellRequestBody extends IBuyRequestBody {
  orderQuantity: number;
}
