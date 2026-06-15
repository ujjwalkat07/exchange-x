"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface TickerData {
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

interface TickerProps {
    token: string;
}
declare global {
    interface Window {
        TradingView: any;
    }
}
interface MarkPrice {
    s: string;
    p: number;
    r: string;
    T: number;
}
export default function MarketPage() {
    const priceMapRef = useRef<Map<string, MarkPrice>>(new Map());
    const [selected, setSelected] = useState("BTCUSDT");
    const [sortedPrices, setSortedPrices] = useState<MarkPrice[]>([]);
    const [connected, setConnected] = useState(false);
    const [ticker, setTicker] = useState<TickerData | null>(null);
    const [search, setSearch] = useState("");
    const chartRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<any>(null);
    const token = useParams()
    // TradingView widget
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = () => initWidget(selected);
        document.head.appendChild(script);
        return () => { document.head.removeChild(script); };
    }, []);

    const initWidget = (symbol: string) => {
        if (!chartRef.current || !window.TradingView) return;
        chartRef.current.innerHTML = "";
        widgetRef.current = new window.TradingView.widget({
            container_id: "tv-chart",
            symbol: `BINANCE:${symbol}`,
            interval: "15",
            theme: "dark",
            style: "3", // line chart
            locale: "en",
            toolbar_bg: "#0a0a0f",
            enable_publishing: false,
            hide_side_toolbar: true,
            hide_top_toolbar: false,
            save_image: false,
            backgroundColor: "#0a0a0f",
            gridColor: "rgba(255,255,255,0.03)",
            width: "100%",
            height: "100%",
            autosize: true,
            studies: [],
            overrides: {
                "paneProperties.background": "#0a0a0f",
                "paneProperties.backgroundType": "solid",
                "mainSeriesProperties.lineStyle.color": "#00d4aa",
                "mainSeriesProperties.lineStyle.linewidth": 2,
            },
        });
    };

    // WebSocket for live prices
    useEffect(() => {
        const ws = new window.WebSocket("wss://fstream.binance.com/stream?streams=!markPrice@arr");

        ws.onopen = () => setConnected(true);

        ws.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                const prices = data?.data;
                if (!prices.length) return;

                prices.forEach((item: MarkPrice) => {
                    priceMapRef.current.set(item.s, item);
                });

                setSortedPrices(Array.from(priceMapRef.current.values()));
            } catch (err) {
                console.error("Parse error:", err);
            }
        };

        ws.onerror = (err) => console.error("WebSocket error:", err);
        ws.onclose = () => {
            setConnected(false);
            console.warn("Binance WebSocket closed");
        };

        return () => ws.close();
    }, []);

    useEffect(() => {
        const ws = new window.WebSocket(
            `wss://fstream.binance.com/stream?streams=${String(token.currency).toLowerCase()}@ticker`
        );
        ws.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                const prices = data?.data;

                if (!prices) return;
                setTicker(prices)
            } catch (err) {
                console.error("Parse error:", err);
            }
        };

        ws.onerror = (err) => console.error("WebSocket error:", err);
        ws.onclose = () => {
            console.warn("Binance WebSocket closed");
        };

        return () => ws.close();
    }, [token.currency]);
    const filtered = search
        ? sortedPrices.filter((item) =>
            item.s.toLowerCase().includes(search.toLowerCase())
        )
        : sortedPrices;
    return (
        <div
            className="min-h-screen bg-[#0a0a0f] text-white flex flex-col font-mono"
        >

            <div className="flex flex-1 max-h-145 overflow-y-auto">
                {/* Sidebar — asset list */}
                <aside className="w-64 border-r border-white/5 flex flex-col overflow-y-auto shrink-0">
                    <div className="px-3 pt-4 pb-2">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-3">Markets</p>
                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="Search Token"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-gray-900 border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 placeholder-slate-600 outline-none focus:border-slate-500 transition-colors"
                            />
                        </div>
                    </div>
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 z-10 bg-black">
                            <tr className="text-slate-500">
                                <th className="px-3 py-1.5 text-left font-medium min-w-[6rem]">
                                    Asset
                                </th>
                                <th className="px-3 py-1.5 text-right font-medium min-w-[6rem]">
                                    Mark Price
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-3 py-6 text-center text-slate-600"
                                    >
                                        {connected ? "No results" : "Waiting for data…"}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item) => {
                                    return (
                                        <tr
                                            key={item.s}
                                            className="border-b border-slate-900 hover:bg-slate-900/50 transition-colors"
                                        >
                                            <td className="px-3 py-2 text-slate-50 font-medium">
                                                <Link href={`/in/spot/${item.s}`}>
                                                    {item.s}
                                                </Link>
                                            </td>
                                            <td className={`px-3 py-2 text-right font-mono text-slate-300`}>
                                            <Link href={`/in/spot/${item.s}`}>
                                                    {item.p}
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                </aside>

                {/* Main content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Ticker bar */}
                    <div className="border-b border-white/5 px-6 py-4 flex items-center gap-8">
                        <div className="font-semibold text-gray-100 text-2xl">
                            {ticker?.s}
                        </div>
                        <div className="text-white text-bold">
                            $ {ticker?.c}
                        </div>
                        <div className={Number(ticker?.P) >= 0 ? "text-green-400 flex flex-col" : "text-red-400 flex flex-col"}>
                            <span className="text-gray-600 text-xs">24h Chg</span>
                            <span className="text-sm">{ticker?.p}{"   "}{ticker?.P}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 text-xs">Open Price</span>
                            <span className="text-sm text-white" >{ticker?.o}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 text-xs">24h High</span>
                            <span className="text-sm text-white" >{ticker?.h}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 text-xs">24h Low</span>
                            <span className="text-sm text-white" >{ticker?.l}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 text-xs">24h Vol(BTC)</span>
                            <span className="text-sm text-white" >{ticker?.v}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 text-xs">24h Vol(USDT)</span>
                            <span className="text-sm text-white" >{ticker?.q}</span>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="flex-1 relative">
                        <div id="tv-chart" ref={chartRef} className="absolute inset-0" />
                    </div>

                    {/* Bottom price grid */}
                    <div className="border-t border-white/5 grid grid-cols-5 divide-x divide-white/5">
                        {/* {FEATURED.map((sym) => {
                            const d = prices.get(sym);
                            const pos = Number(d?.P ?? 0) >= 0;
                            return (
                                <button
                                    key={sym}
                                    onClick={() => changeSymbol(sym)}
                                    className={`px-4 py-3 text-left hover:bg-white/3 transition-colors ${selected === sym ? "bg-[#00d4aa]/5" : ""}`}
                                >
                                    <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">{sym.replace("USDT", "")}</p>
                                    <p className="text-sm text-white/80">${d ? fmt(d.c) : "—"}</p>
                                    <p className={`text-[10px] mt-0.5 ${pos ? "text-[#00d4aa]" : "text-red-400"}`}>
                                        {pos ? "+" : ""}{Number(d?.P ?? 0).toFixed(2)}%
                                    </p>
                                </button>
                            );
                        })} */}
                    </div>
                </main>
            </div>
        </div>
    );
}