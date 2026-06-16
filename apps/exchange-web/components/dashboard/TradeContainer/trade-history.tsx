"use client";

import { api } from "@/lib/axios";
import { RootState } from "@/store/store";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface TradeItem {
  _id: string;
  currencyPair: string;
  tradedQuantity: number;
  executionPrice: number;
  orderAmount: number;
  status: string;
  orderSide: "BUY" | "SELL";
  orderId: string;
  createdAt: string;
}

const TradeHistory = () => {
  const [data, setData] = useState<TradeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isChanging = useSelector((state: RootState) => state.order.orderCountStatus);
  const isSocketChanging = useSelector(
    (state: RootState) => state.socket.status,
  );

  useEffect(() => {
    const fetchTradeHistory = async () => {
      try {
        const res = await api.get("/api/trade-history");
        setData(res.data.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to load trades");
        } else {
          setError("Something went wrong");
        }
      }
    };

    fetchTradeHistory();
  }, [isChanging, isSocketChanging]);

  return (
    <div className="w-full overflow-x-auto mt-5">
      <table className="w-full min-w-[900px] text-xs font-mono text-slate-200">
        <thead>
          <tr className="text-slate-500 border-b border-slate-800 text-left">
            <th className="pb-3 pl-3 font-medium">Asset</th>
            <th className="pb-3 font-medium">Executed Qty</th>
            <th className="pb-3 font-medium">Execution Price</th>
            <th className="pb-3 font-medium">Total Value</th>
            <th className="pb-3 font-medium">Order Id</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Time</th>
            <th className="pb-3 pr-3 font-medium text-right">Side</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-12 text-slate-500 text-sm">
                {error || "No trade history"}
              </td>
            </tr>
          )}
          {data.map((trade) => (
            <tr
              key={trade._id}
              className="border-b border-slate-900/60 hover:bg-slate-900/40 transition-colors"
            >
              <td className="py-3.5 pl-3 font-semibold text-slate-200">{trade.currencyPair.toUpperCase()}</td>
              <td className="py-3.5">{Number(trade.tradedQuantity).toFixed(6)}</td>
              <td className="py-3.5">${Number(trade.executionPrice).toFixed(2)}</td>
              <td className="py-3.5">${Number(trade.orderAmount).toFixed(2)}</td>
              <td className="py-3.5 text-slate-400">{trade.orderId}</td>
              <td className="py-3.5">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                  {trade.status}
                </span>
              </td>
              <td className="py-3.5 text-slate-400">
                {new Date(trade.createdAt).toLocaleString(undefined, {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </td>
              <td className="py-3.5 pr-3 text-right font-semibold">
                <span className={trade.orderSide === "BUY" ? "text-emerald-400" : "text-red-400"}>
                  {trade.orderSide}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradeHistory;
