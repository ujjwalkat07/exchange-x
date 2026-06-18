import { MarketSummaryProps } from "@/lib/types";
import { useEffect, useRef } from "react";

const TradingViewMarketSummary = ({
  showTimeRange = true,
  direction = "vertical",
  assetsType = "crypto",
  itemSize = "compact",
  theme = "dark",
}: MarketSummaryProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://widgets.tradingview-widget.com/w/en/tv-market-summary.js";
    document.head.appendChild(script);

    const widget = document.createElement("tv-market-summary") as HTMLElement;
    if (showTimeRange) widget.setAttribute("show-time-range", "");
    widget.setAttribute("direction", direction);
    widget.setAttribute("assets-type", assetsType);
    widget.setAttribute("item-size", itemSize);
    widget.setAttribute("theme", theme);
    container.appendChild(widget);

    return () => {
      if (container.contains(widget)) container.removeChild(widget);
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [showTimeRange, direction, assetsType]);

  return <div ref={containerRef} />;
};

export default TradingViewMarketSummary;
