"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

interface MiniTicker {
  s: string;
  c: string;
  o: string;
  h: string;
  l: string;
  v: string;
  q: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

const formatPrice = (val?: string | number): string => {
  if (val === undefined || val === null || val === "") return "--";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "--";
  if (num >= 1000) {
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (num >= 1) {
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  return "$" + num.toFixed(4);
};

const formatVol = (val?: string | number): string => {
  if (!val) return "--";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "--";
  if (num >= 1e9) {
    return "$" + (num / 1e9).toFixed(2) + "B";
  }
  if (num >= 1e6) {
    return "$" + (num / 1e6).toFixed(2) + "M";
  }
  if (num >= 1e3) {
    return "$" + (num / 1e3).toFixed(2) + "K";
  }
  return "$" + num.toFixed(2);
};

const getChangePercent = (ticker?: MiniTicker): number | null => {
  if (!ticker) return null;
  const current = parseFloat(ticker.c);
  const open = parseFloat(ticker.o);
  if (!open || isNaN(current) || isNaN(open)) return null;
  return ((current - open) / open) * 100;
};

export default function MarketPage() {
  const params = useParams();
  const routeSymbol = (params?.currency as string)?.toUpperCase() || "BTCUSDT";

  const [selectedSymbol, setSelectedSymbol] = React.useState<string>(routeSymbol);
  const [tickersMap, setTickersMap] = React.useState<Map<string, MiniTicker>>(new Map());

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"ALL" | "GAINERS" | "LOSERS">("ALL");
  const [priceFlash, setPriceFlash] = React.useState<"up" | "down" | null>(null);

  const prevPriceRef = React.useRef<number | null>(null);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (routeSymbol && routeSymbol !== selectedSymbol) {
      setSelectedSymbol(routeSymbol);
    }
  }, [routeSymbol]);

  const handleSelectSymbol = (sym: string) => {
    const clean = sym.toUpperCase();
    setSelectedSymbol(clean);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/in/market/${clean.toLowerCase()}`);
    }
  };

  React.useEffect(() => {
    let ws: WebSocket | null = null;
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        ws = new WebSocket("wss://fstream.binance.com/market/stream?streams=!miniTicker@arr");

        ws.onmessage = (event: MessageEvent) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            const list: MiniTicker[] = data?.data;
            if (!Array.isArray(list)) return;

            setTickersMap((prevMap) => {
              const updated = new Map(prevMap);
              list.forEach((item) => {
                if (item.s && item.s.endsWith("USDT") && !item.s.includes("_")) {
                  updated.set(item.s, item);
                }
              });
              return updated;
            });
          } catch (e) {
            console.error("WS error:", e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.warn("WS connect failed:", e);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const activeTicker = tickersMap.get(selectedSymbol);

  React.useEffect(() => {
    if (!activeTicker) return;
    const current = parseFloat(activeTicker.c);
    if (prevPriceRef.current !== null && current !== prevPriceRef.current) {
      const dir = current > prevPriceRef.current ? "up" : "down";
      setPriceFlash(dir);
      const timer = setTimeout(() => setPriceFlash(null), 500);
      prevPriceRef.current = current;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = current;
  }, [activeTicker?.c]);

  React.useEffect(() => {
    const scriptId = "tv-widget-script";
    let isMounted = true;

    const initChart = () => {
      if (!chartContainerRef.current || !window.TradingView) return;

      chartContainerRef.current.innerHTML = "";
      const containerId = "tv_chart_main";
      const div = document.createElement("div");
      div.id = containerId;
      div.className = "w-full h-full";
      chartContainerRef.current.appendChild(div);

      try {
        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${selectedSymbol}`,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: containerId,
          backgroundColor: "#09090b",
          gridColor: "rgba(255, 255, 255, 0.04)",
          hide_side_toolbar: false,
          hide_top_toolbar: false,
          studies: ["MASimple@tv-basicstudies"],
          overrides: {
            "paneProperties.background": "#09090b",
            "paneProperties.backgroundType": "solid",
            "mainSeriesProperties.candleStyle.upColor": "#10b981",
            "mainSeriesProperties.candleStyle.downColor": "#f43f5e",
            "mainSeriesProperties.candleStyle.borderUpColor": "#10b981",
            "mainSeriesProperties.candleStyle.borderDownColor": "#f43f5e",
            "mainSeriesProperties.candleStyle.wickUpColor": "#10b981",
            "mainSeriesProperties.candleStyle.wickDownColor": "#f43f5e",
          },
        });
      } catch (err) {
        console.warn("TV init failed:", err);
      }
    };

    if (window.TradingView) {
      initChart();
    } else if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = () => {
        if (isMounted) initChart();
      };
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol]);

  const marketList = React.useMemo(() => {
    const list = Array.from(tickersMap.values()).filter((item) =>
      item.s.endsWith("USDT")
    );

    list.sort((a, b) => parseFloat(b.q || "0") - parseFloat(a.q || "0"));

    return list.filter((item) => {
      const chg = getChangePercent(item);
      if (filter === "GAINERS" && (chg === null || chg < 0)) return false;
      if (filter === "LOSERS" && (chg === null || chg >= 0)) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return item.s.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tickersMap, search, filter]);

  const changePercent = getChangePercent(activeTicker);
  const isPositive = changePercent !== null ? changePercent >= 0 : true;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background text-foreground font-sans overflow-hidden">
      <div className="border-b border-border bg-card/60 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold font-mono tracking-tight text-foreground">
              {selectedSymbol.replace("USDT", "")}
              <span className="text-muted-foreground font-normal">/USDT</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 border-l border-border pl-4">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono transition-colors duration-200 ${
                priceFlash === "up"
                  ? "text-emerald-400"
                  : priceFlash === "down"
                  ? "text-rose-400"
                  : "text-foreground"
              }`}
            >
              {activeTicker ? formatPrice(activeTicker.c) : "--"}
            </span>

            {changePercent !== null ? (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium px-2 py-0.5 rounded ${
                  isPositive
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-rose-400 bg-rose-500/10"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {isPositive ? "+" : ""}
                  {changePercent.toFixed(2)}%
                </span>
              </span>
            ) : (
              <span className="text-xs font-mono text-muted-foreground">--</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-8 shrink-0 text-xs">
          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium">24h High</span>
            <span className="font-mono text-foreground font-medium">
              {activeTicker ? formatPrice(activeTicker.h) : "--"}
            </span>
          </div>

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium">24h Low</span>
            <span className="font-mono text-foreground font-medium">
              {activeTicker ? formatPrice(activeTicker.l) : "--"}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium">24h Volume (USDT)</span>
            <span className="font-mono text-foreground font-semibold">
              {activeTicker ? formatVol(activeTicker.q) : "--"}
            </span>
          </div>

          <Link
            href={`/in/spot/${selectedSymbol.toLowerCase()}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <span>Trade Spot</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <aside className="w-full md:w-72 lg:w-80 border-r border-border bg-card/30 flex flex-col shrink-0 overflow-hidden">
          <div className="p-2.5 border-b border-border space-y-2 bg-card/40 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search coin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted/40 border border-border text-foreground text-xs rounded-md pl-8 pr-7 py-1.5 placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors font-mono"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] font-medium">
              {(["ALL", "GAINERS", "LOSERS"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
                    filter === tab
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "ALL" ? "All" : tab === "GAINERS" ? "Gainers" : "Losers"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-mono text-muted-foreground border-b border-border bg-muted/10 shrink-0 select-none">
            <span className="col-span-5">Pair</span>
            <span className="col-span-4 text-right">Price</span>
            <span className="col-span-3 text-right">24h Chg</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/20">
            {marketList.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connecting to live feed...</span>
              </div>
            ) : (
              marketList.map((item) => {
                const isSelected = item.s === selectedSymbol;
                const chg = getChangePercent(item);
                const pos = chg !== null ? chg >= 0 : true;

                return (
                  <button
                    key={item.s}
                    onClick={() => handleSelectSymbol(item.s)}
                    className={`w-full text-left px-3 py-2 grid grid-cols-12 items-center text-xs font-mono transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-muted/70 text-foreground font-semibold border-l-2 border-foreground"
                        : "hover:bg-muted/30 text-zinc-300 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="col-span-5 truncate">
                      <span className="font-semibold text-foreground">
                        {item.s.replace("USDT", "")}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        /USDT
                      </span>
                    </div>

                    <div className="col-span-4 text-right font-medium text-foreground">
                      {formatPrice(item.c)}
                    </div>

                    <div
                      className={`col-span-3 text-right font-medium text-[11px] ${
                        chg === null
                          ? "text-muted-foreground"
                          : pos
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {chg !== null ? `${pos ? "+" : ""}${chg.toFixed(2)}%` : "--"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-[#09090b] relative">
          <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
        </main>
      </div>
    </div>
  );
}
