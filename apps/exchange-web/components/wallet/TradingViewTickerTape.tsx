import { TickerTapeProps } from "@/lib/types";
import { useEffect, useRef } from "react";

const TickerTape = ({
  symbols = "BINANCE:BTCUSDT,BINANCE:ETHUSDT,BINANCE:XRPUSDT,BINANCE:DOGEUSDT,BINANCE:BNBUSDT,BINANCE:LINKUSDT,BINANCE:AVAXUSDT",
  hideChart = true,
  itemSize = "compact",
  theme="dark"
}: TickerTapeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Load the TradingView widget script
    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js";
    document.head.appendChild(script);

    // Create the custom element
    const ticker = document.createElement("tv-ticker-tape") as HTMLElement;
    ticker.setAttribute("symbols", symbols);
    if (hideChart) ticker.setAttribute("hide-chart", "");
    ticker.setAttribute("item-size", itemSize);
    ticker.setAttribute("theme", theme);
    container.appendChild(ticker);

    return () => {
      // Cleanup on unmount
      if (container.contains(ticker)) {
        container.removeChild(ticker);
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbols, hideChart, itemSize]);

  return <div ref={containerRef} />;
};

export default TickerTape;