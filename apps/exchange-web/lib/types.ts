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
 export  interface OpenPosition {
    orderId: string;
    currencyPair: string;
    orderQuantity: number;
    entryPrice: number;
    orderType: string;
    positionStatus: string;
    orderSide: "BUY" | "SELL";
    _id: string;
  }
 export  interface OrderHistory {
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
    theme:"dark"
  }

  export interface MarketSummaryProps {
    showTimeRange?: boolean;
    direction?: "vertical" | "horizontal";
    assetsType?: "crypto" | "stocks" | "forex" | "futures";
    itemSize: string;
    theme: string
  }

  export interface TickerData {
    s: string;   // Symbol
    c: string;   // Last price
    p: string;   // Price change
    P: string;   // Price change percent
    h: string;   // High price
    l: string;   // Low price
    v: string;  // Volume
    q: string   // Total traded base asset volume
    o: string
  }

  export interface TickerProps {
    token: string;
  }