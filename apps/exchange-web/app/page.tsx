"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ExternalLink,
  Lock,
  Radio,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

interface BinanceTickerData {
  s: string; // Symbol (e.g., BTCUSDT)
  c: string; // Last price
  p: string; // 24h Price change
  P: string; // 24h Price change percent
  h: string; // 24h High
  l: string; // 24h Low
  v: string; // 24h Volume (base asset)
  q: string; // 24h Volume (quote asset in USDT)
}

interface MarketConfig {
  symbol: string;
  streamKey: string;
  name: string;
  href: string;
  defaultPrice?: number;
  defaultChange?: number;
  defaultVol?: string;
}

const MARKETS: MarketConfig[] = [
  {
    symbol: "BTC/USDT",
    streamKey: "BTCUSDT",
    name: "Bitcoin",
    defaultPrice: 77974.5,
    defaultChange: 0.68,
    defaultVol: "$3.72B",
    href: "/in/spot/btcusdt",
  },
  {
    symbol: "ETH/USDT",
    streamKey: "ETHUSDT",
    name: "Ethereum",
    defaultPrice: 2842.15,
    defaultChange: 1.38,
    defaultVol: "$1.82B",
    href: "/in/spot/ethusdt",
  },
  {
    symbol: "SOL/USDT",
    streamKey: "SOLUSDT",
    name: "Solana",
    defaultPrice: 184.6,
    defaultChange: 3.42,
    defaultVol: "$942.15M",
    href: "/in/spot/solusdt",
  },
  {
    symbol: "BNB/USDT",
    streamKey: "BNBUSDT",
    name: "BNB Chain",
    defaultPrice: 612.4,
    defaultChange: 0.45,
    defaultVol: "$510.30M",
    href: "/in/spot/bnbusdt",
  },
  {
    symbol: "XRP/USDT",
    streamKey: "XRPUSDT",
    name: "Ripple",
    defaultPrice: 0.584,
    defaultChange: 2.15,
    defaultVol: "$420.50M",
    href: "/in/spot/xrpusdt",
  },
  {
    symbol: "SAND/USDT",
    streamKey: "SANDUSDT",
    name: "SAND",
    defaultPrice: 0.584,
    defaultChange: 2.15,
    defaultVol: "$420.50M",
    href: "/in/spot/xrpusdt",
  },
  {
    symbol: "FET/USDT",
    streamKey: "FETUSDT",
    name: "Fetch AI",
    defaultPrice: 0.584,
    defaultChange: 2.15,
    defaultVol: "$420.50M",
    href: "/in/spot/xrpusdt",
  },
  {
    symbol: "BAT/USDT",
    streamKey: "BATUSDT",
    name: "Basic Attention Token",
    defaultPrice: 0.584,
    defaultChange: 2.15,
    defaultVol: "$420.50M",
    href: "/in/spot/xrpusdt",
  },
];

const formatPrice = (val?: string | number) => {
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

const formatVol = (val?: string | number) => {
  if (!val) return "--";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "--";
  if (num >= 1e9) {
    return "$" + (num / 1e9).toFixed(2) + "B";
  }
  return "$" + (num / 1e6).toFixed(2) + "M";
};

export default function LandingPage() {
  const [tickers, setTickers] = React.useState<Record<string, BinanceTickerData>>({});
  const [priceFlash, setPriceFlash] = React.useState<Record<string, "up" | "down" | null>>({});
  const [isConnected, setIsConnected] = React.useState(false);
  const [tickCount, setTickCount] = React.useState(0);
  const prevPriceMap = React.useRef<Map<string, number>>(new Map());

  // ── Binance WebSocket Connection ──────────────────────────────────────────
  React.useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const streams = MARKETS.map((m) => `${m.streamKey.toLowerCase()}@ticker`).join("/");
    const wsUrl = `wss://fstream.binance.com/market/stream?streams=${streams}`;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
        };

        ws.onmessage = (event: MessageEvent) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);
            const data: BinanceTickerData = payload?.data;
            if (!data || !data.s) return;

            const symbol = data.s.toUpperCase();
            const currentPrice = parseFloat(data.c);

            setTickers((prev) => ({
              ...prev,
              [symbol]: data,
            }));

            setTickCount((prev) => prev + 1);

            const prevPrice = prevPriceMap.current.get(symbol);
            if (prevPrice !== undefined && currentPrice !== prevPrice) {
              const dir = currentPrice > prevPrice ? "up" : "down";
              setPriceFlash((prev) => ({ ...prev, [symbol]: dir }));
              setTimeout(() => {
                if (isMounted) {
                  setPriceFlash((prev) => ({ ...prev, [symbol]: null }));
                }
              }, 600);
            }
            prevPriceMap.current.set(symbol, currentPrice);
          } catch (err) {
            console.error("Binance WS message parsing error:", err);
          }
        };

        ws.onerror = (err) => {
          console.warn("Binance WebSocket error:", err);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          reconnectTimeout = setTimeout(() => {
            if (isMounted) connectWebSocket();
          }, 3000);
        };
      } catch (err) {
        console.warn("Binance WebSocket connection error:", err);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  const btcTicker = tickers["BTCUSDT"];
  const btcPrice = btcTicker ? parseFloat(btcTicker.c) : 77974.5;
  const btcChangePercent = btcTicker ? parseFloat(btcTicker.P) : 0.68;
  const btcChangeAmount = btcTicker ? parseFloat(btcTicker.p) : 522.6;
  const btcVol = btcTicker ? formatVol(btcTicker.q) : "$3.72B";
  const btcHigh = btcTicker ? formatPrice(btcTicker.h) : "$78,231.30";
  const btcLow = btcTicker ? formatPrice(btcTicker.l) : "$77,333.40";

  const steps = [
    {
      num: "01",
      title: "Create an Account",
      desc: "Sign up in 30 seconds with email. Access real-time paper trading or live markets with zero friction.",
      icon: <Lock className="w-4 h-4" />,
    },
    {
      num: "02",
      title: "Deposit Crypto or Fiat",
      desc: "Instant multi-network deposit confirmations across 50+ blockchains including Bitcoin, Ethereum, and Solana.",
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      num: "03",
      title: "Trade with Precision",
      desc: "Execute spot trades with TradingView charts, limit & market orders, or automate via high-speed APIs.",
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground selection:text-background">

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <section id="overview" className="pt-16 pb-10 sm:pt-20 sm:pb-14 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Release / Status Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/30 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Binance Real-Time Feeds · Sub-millisecond Execution · 400+ Pairs</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.15] max-w-4xl mx-auto">
          The high-performance crypto exchange for professional traders.
        </h1>

        {/* Subhead */}
        <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
          Trade Bitcoin, Ethereum, and 400+ crypto pairs with sub-microsecond matching,
          deep order books, and live Binance streaming price feeds.
        </p>

        {/* CTA Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/in/auth/signup"
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-foreground text-background font-medium text-sm hover:opacity-90 transition-all shadow-sm"
          >
            <span>Start Trading Free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/in/spot/btcusdt"
            className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-border bg-card hover:bg-muted/60 font-medium text-sm text-foreground transition-colors"
          >
            <Zap className="h-4 w-4 text-emerald-400" />
            <span>Live Terminal</span>
          </Link>

          <Link
            href="/in/market/btcusdt"
            className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-border bg-card hover:bg-muted/60 font-medium text-sm text-foreground transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span>Explore Markets</span>
          </Link>
        </div>
      </section>

      {/* ── Main Showcase with Real-Time Highlights Strip (HERO IMAGE) ─────── */}
      <section id="dashboard-preview" className="pb-16 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Window Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-border" />
              <span className="h-3 w-3 rounded-full bg-border" />
              <span className="h-3 w-3 rounded-full bg-border" />
              <span className="ml-2 text-xs font-medium text-muted-foreground hidden sm:inline-block">
                cryptoexchange.io/spot/btcusdt · Live Spot Order Book &amp; TradingView Charts
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Binance WS: {formatPrice(btcPrice)}</span>
              </span>
              <Link
                href="/in/spot/btcusdt"
                className="text-xs text-foreground font-medium hover:underline flex items-center gap-1 border-l border-border pl-3"
              >
                <span>Open in Terminal</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Screenshot Image Container */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[1917/1008] bg-zinc-950 overflow-hidden">
            <Image
              src="/image.png"
              alt="CryptoExchange Professional Trading Interface - Spot Orderbook, Charts and Positions"
              fill
              priority
              className="object-cover object-top"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>

      
        </div>
      </section>

      {/* ── Featured Markets with Live Binance WebSocket Prices ────────────── */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
           
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Featured Markets
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time spot prices, 24h market volume, and instant orderbook execution.
            </p>
          </div>
          <Link
            href="/in/market/btcusdt"
            className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all 400+ pairs</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MARKETS.map((m) => {
            const ticker = tickers[m.streamKey];
            const price = ticker ? formatPrice(ticker.c) : formatPrice(m.defaultPrice);
            const change = ticker ? parseFloat(ticker.P) : (m.defaultChange ?? 0);
            const isPositive = change >= 0;
            const vol = ticker ? formatVol(ticker.q) : (m.defaultVol ?? "--");
            const flash = priceFlash[m.streamKey];

            return (
              <Link
                key={m.symbol}
                href={m.href}
                className={`p-5 rounded-xl border border-gray-800 bg-card hover:bg-muted/40 transition-all space-y-3 group `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      {m.symbol}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </div>
                    <div className="text-xs text-muted-foreground">{m.name}</div>
                  </div>
                  <span
                    className={`text-xs font-mono font-medium px-2 py-0.5 rounded transition-colors ${
                      isPositive
                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                        : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {change?.toFixed(2)}%
                  </span>
                </div>

                <div>
                  <div
                    className={`text-xl font-bold font-mono transition-colors duration-300 ${
                      flash === "up"
                        ? "text-emerald-400"
                        : flash === "down"
                        ? "text-rose-400"
                        : "text-foreground"
                    }`}
                  >
                    {price}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                    <span>24h Vol: {vol}</span>
                    
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Bottom Call To Action ───────────────────────────────────────────── */}
      <section className="py-16 border-t border-border bg-muted/20 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Start trading on the next-generation crypto exchange.
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign up in seconds, deposit crypto or fiat, and access 400+ markets with industry-leading execution speed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/in/auth/signup"
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-foreground text-background font-medium text-xs hover:opacity-90 transition-opacity"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/in/auth/login"
              className="px-4 py-2.5 rounded-md border border-border bg-card hover:bg-muted font-medium text-xs text-foreground transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-background py-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span>
              Binance Market Stream: {isConnected ? "Operational" : "Connecting..."}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/in/spot/btcusdt" className="hover:text-foreground transition-colors">
              Spot Trading
            </Link>
            <Link href="/in/market/btcusdt" className="hover:text-foreground transition-colors">
              Markets
            </Link>
            <Link href="/in/wallet" className="hover:text-foreground transition-colors">
              Wallet
            </Link>
            <Link href="/in/auth/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/in/auth/signup" className="hover:text-foreground transition-colors">
              Sign Up
            </Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} CryptoExchange Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
