import React, { useEffect, useRef, memo } from 'react';

// ✅ Fix 1: Correct prop type - should be an object, not a primitive string
type TradingViewWidgetProps = {
  symbol: string;
};

function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const existingScript = container.current.querySelector("script");
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = JSON.stringify({
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: true,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval: "D",
      locale: "en",
      save_image: true,
      style: "1",
      symbol: `BINANCE:${symbol.toUpperCase()}`,
      theme: "dark",
      timezone: "Etc/UTC",
      backgroundColor: "#0F0F0F",
      gridColor: "rgba(242, 242, 242, 0.06)",
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [],
      width: 680,
      height: 420
    });

    container.current.appendChild(script);
    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [symbol]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: "100%", width: "100%" }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: "calc(100% - 32px)", width: "100%" }}
      />
    </div>
  );
}

export default memo(TradingViewWidget);