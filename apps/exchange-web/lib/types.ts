export interface ClosePosition {
  orderId: string;
  currencyPair: string;
  orderQuantity: number;
  entryPrice: number;
  orderType: string;
  positionStatus: string;
  orderSide: "BUY" | "SELL";
  _id: string;
}
export interface OpenPosition {
  orderId: string;
  currencyPair: string;
  orderQuantity: number;
  entryPrice: number;
  orderType: string;
  positionStatus: string;
  orderSide: "BUY" | "SELL";
  _id: string;
}
export interface OrderHistory {
  orderId: string;
  currencyPair: string;
  tradedQuantity: number;
  executionPrice: number;
  orderAmount: number;
  orderType: string;
  status: string;
  orderSide: "BUY" | "SELL";
  _id: string;
}

export interface WalletAsset {
  asset: string;
  user: string;
  balance: number;
}

export interface TickerTapeProps {
  symbols?: string;
  hideChart?: boolean;
  itemSize?: "regular" | "compact" | "large";
  theme: "dark";
}

export interface MarketSummaryProps {
  showTimeRange?: boolean;
  direction?: "vertical" | "horizontal";
  assetsType?: "crypto" | "stocks" | "forex" | "futures";
  itemSize: string;
  theme: string;
}

export interface TickerData {
  s: string;
  c: string;
  p: string;
  P: string;
  h: string;
  l: string;
  v: string;
  q: string;
  o: string;
}

export interface TickerProps {
  token: string;
}
