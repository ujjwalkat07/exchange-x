export { openPosition } from "./order-filled-controller";
export { buyOrder, sellOrder } from "./order-place-controller";
export { cancelOrder } from "./order-cancel-controller";
export { getOpenOrders } from "./order-open-controller";
export { closePosition } from "./order-closed-controller";

export { Redis } from "../../../../config/redis-config/redis-connection";
export { Kafka } from "../../../../config/kafka-config/kafka-producer";
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
  orderType: "Market" | "Limit";
  entryPrice?: number;
  positionStatus: "Open" | "Filled" | "Closed" | "Cancelled";
  orderAmount: number;
  orderSide: "BUY" | "SELL"; // USDT
}

export interface ISellRequestBody extends IBuyRequestBody {
  orderQuantity: number;
}
