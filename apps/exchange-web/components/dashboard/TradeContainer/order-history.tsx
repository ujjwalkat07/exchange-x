"use client";

import { api } from "@/lib/axios";
import { RootState } from "@/store/store";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ClosePosition } from "@/lib/types";

const OrderHistory = () => {
  const [data, setData] = useState<ClosePosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isChanging = useSelector((state: RootState) => state.order.orderCountStatus);
  const isSocketChanging = useSelector(
    (state: RootState) => state.socket.status,
  );

  useEffect(() => {
    const fetchClosePositions = async () => {
      try {
        const res = await api.get("/api/order/closedPositions");
        setData(res.data.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to load orders");
        } else {
          setError("Something went wrong");
        }
      }
    };

    fetchClosePositions();
  }, [isChanging, isSocketChanging]);

  return (
    <div className="w-full overflow-x-auto mt-5">
      <table className="w-full min-w-[800px] text-xs font-mono text-slate-200">
        <thead>
          <tr className="text-slate-500 border-b border-slate-800 text-left">
            <th className="pb-3 pl-3 font-medium">Asset</th>
            <th className="pb-3 font-medium">Quantity</th>
            <th className="pb-3 font-medium">Entry Price</th>
            <th className="pb-3 font-medium">Order Id</th>
            <th className="pb-3 font-medium">Order Type</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 pr-3 font-medium text-right">Side</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                {error || "No order history"}
              </td>
            </tr>
          )}
          {data.map((order) => (
            <tr
              key={order.orderId}
              className="border-b border-slate-900/60 hover:bg-slate-900/40 transition-colors"
            >
              <td className="py-3.5 pl-3 font-semibold text-slate-200">{order.currencyPair.toUpperCase()}</td>
              <td className="py-3.5">{Number(order.orderQuantity).toFixed(6)}</td>
              <td className="py-3.5">${Number(order.entryPrice).toFixed(2)}</td>
              <td className="py-3.5 text-slate-400">{order.orderId}</td>
              <td className="py-3.5 text-slate-400">{order.orderType}</td>
              <td className="py-3.5">
                <span className="bg-slate-800/80 text-slate-300 border border-slate-700/50 px-2 py-0.5 rounded text-[10px]">
                  {order.positionStatus}
                </span>
              </td>
              <td className="py-3.5 pr-3 text-right font-semibold">
                <span className={order.orderSide === "BUY" ? "text-emerald-400" : "text-red-400"}>
                  {order.orderSide}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderHistory;