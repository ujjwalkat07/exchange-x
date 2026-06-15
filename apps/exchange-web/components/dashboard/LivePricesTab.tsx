"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface MarkPrice {
  s: string;
  p: number;
  r: string;
  T: number;
}

const formatPrice = (price: number): string => {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
};

const LivePrices = () => {
  const priceMapRef = useRef<Map<string, MarkPrice>>(new Map());
  const [sortedPrices, setSortedPrices] = useState<MarkPrice[]>([]);
  const [connected, setConnected] = useState(false);
  const [search, setSearch] = useState("");

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

  const filtered = search
    ? sortedPrices.filter((item) =>
        item.s.toLowerCase().includes(search.toLowerCase())
      )
    : sortedPrices;

  return (
    <div className="py-4 text-white mt-2 rounded-sm bg-[#0b0e11] w-full xl:w-68">
      <div className="flex items-center justify-between mx-3 mb-2">
        <h1 className="text-sm font-medium text-slate-50">Asset Prices</h1>
        <span
          className={`flex items-center gap-1.5 text-xs ${
            connected ? "text-green-500" : "text-slate-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-slate-500"
            }`}
          />
          {connected ? "Live" : "Connecting…"}
        </span>
      </div>

      <hr className="border-slate-800 mx-3 mb-3" />

      <div className="mx-3 mb-3">
        <input
          type="text"
          placeholder="Search Token"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 placeholder-slate-600 outline-none focus:border-slate-500 transition-colors"
        />
      </div>

      <div className="max-h-90 overflow-y-auto overflow-x-auto">
        <table className="w-full min-w-[200px] text-xs">
          <thead className="sticky top-0 z-10 bg-black">
            <tr className="text-slate-500">
              <th className="px-3 py-1.5 text-left font-medium min-w-24">
                Asset
              </th>
              <th className="px-3 py-1.5 text-right font-medium min-w-24">
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
              filtered.map((item) => (
                <tr
                  key={item.s}
                  className="border-b border-slate-900 hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-3 py-2 text-slate-50 font-medium">
                    <Link
                      href={`/in/spot/${item.s.toLowerCase()}`}
                      className="text-slate-200 hover:text-emerald-400 transition-colors font-medium"
                    >
                      {item.s}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-300">
                    {formatPrice(Number(item.p))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LivePrices;