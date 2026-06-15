"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface MarkPrice {
  s: string;
  p: string;
}

const Holding = () => {
  const params = useParams();
  const asset = String(params.currency || "BTCUSDT").toUpperCase().replace("USDT", "");
  const walletData = useSelector((state: RootState) => state.wallet.data);

  const [livePrice, setLivePrice] = useState<number>(0);

  // Subscribe to live price of the active token to show exact valuation
  useEffect(() => {
    const symbolUpper = String(params.currency || "BTCUSDT").toUpperCase();
    const ws = new WebSocket(`wss://fstream.binance.com/market/stream?streams=${symbolUpper.toLowerCase()}@ticker`);

    ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const ticker = payload?.data;
        if (ticker?.c) {
          setLivePrice(Number(ticker.c));
        }
      } catch (err) {
        // Silent error
      }
    };

    return () => {
      ws.close();
    };
  }, [params.currency]);

  const usdtBalance = Number(walletData?.asset1 || 0);
  const tokenBalance = Number(walletData?.asset2 || 0);

  const tokenValuation = tokenBalance * (livePrice || 1); // fallback if ws not loaded
  const totalValuation = usdtBalance + tokenValuation;

  const holdings = [
    {
      asset: "USDT",
      name: "Tether USD",
      balance: usdtBalance,
      price: 1,
      valuation: usdtBalance,
    },
    {
      asset: asset,
      name: asset === "BTC" ? "Bitcoin" : asset === "ETH" ? "Ethereum" : `${asset} Token`,
      balance: tokenBalance,
      price: livePrice,
      valuation: tokenValuation,
    },
  ];

  return (
    <div className="w-full mt-5 font-mono text-xs">
      <div className="mb-4 bg-slate-900/30 border border-slate-800/40 p-4 rounded-md flex justify-between items-center text-slate-300">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Estimated Portfolio Value</p>
          <h2 className="text-xl font-bold text-slate-100 mt-1">${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500">USD</span></h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-slate-200">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800 text-left">
              <th className="pb-3 pl-3 font-medium">Asset</th>
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Total Balance</th>
              <th className="pb-3 font-medium">Last Price</th>
              <th className="pb-3 pr-3 text-right font-medium">Value (USD)</th>
            </tr>
          </thead>

          <tbody>
            {holdings.map((item) => (
              <tr
                key={item.asset}
                className="border-b border-slate-900/60 hover:bg-slate-900/40 transition-colors"
              >
                {/* Asset Tag */}
                <td className="py-3.5 pl-3">
                  <span className="bg-emerald-600/10 text-emerald-400 border border-emerald-600/30 px-2 py-0.5 rounded text-[10px] font-bold font-sans">
                    {item.asset}
                  </span>
                </td>

                {/* Name */}
                <td className="py-3.5 text-slate-400 font-sans">{item.name}</td>

                {/* Balance */}
                <td className="py-3.5 font-semibold">{item.balance.toFixed(4)}</td>

                {/* Price */}
                <td className="py-3.5">
                  ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: item.price < 1 ? 6 : 2 })}
                </td>

                {/* Valuation */}
                <td className="py-3.5 pr-3 text-right font-semibold text-emerald-400">
                  ${item.valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Holding;
