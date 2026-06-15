"use client";

import { api } from "@/lib/axios";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { OpenPosition } from "@/lib/types";
import { RootState } from "@/store/store";
import { changeOrder } from "@/store/features/orderSlice";
import { IoClose } from "react-icons/io5";
import { RiLoader2Fill } from "react-icons/ri";

const RestingOrders = () => {
  const [data, setData] = useState<OpenPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  const isChanging = useSelector((state: RootState) => state.order.orderCountStatus);
  const isSocketChanging = useSelector((state: RootState) => state.socket.status);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchOpenPositions = async () => {
      try {
        const res = await api.get("/api/order/restingOrders");
        setData(res.data.data);
        console.log("data",res.data.data)
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to load orders");
        } else {
          setError("Something went wrong");
        }
      }
    };

    fetchOpenPositions();
  }, [isChanging, isSocketChanging]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancellingId(orderId);
      await api.post("/api/order/cancelOrder", { orderId });
      dispatch(changeOrder());
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || "Failed to cancel order");
      } else {
        alert("Something went wrong");
      }
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="w-full overflow-x-auto mt-5">
      <table className="w-full min-w-[700px] text-xs font-mono text-slate-200">
        <thead>
          <tr className="text-slate-500 border-b border-slate-800 text-left">
            <th className="pb-3 pl-3 font-medium">Asset</th>
            <th className="pb-3 font-medium">Qty</th>
            <th className="pb-3 font-medium">Entry Price</th>
            <th className="pb-3 font-medium">Order Id</th>
            <th className="pb-3 font-medium">Order Type</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Side</th>
            <th className="pb-3 pr-3 text-right font-medium">Action</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-12 text-slate-500 text-sm">
                {error || "No resting orders"}
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
                <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px]">
                  {order.positionStatus}
                </span>
              </td>
              <td className="py-3.5 font-semibold">
                <span className={order.orderSide === "BUY" ? "text-emerald-400" : "text-red-400"}>
                  {order.orderSide}
                </span>
              </td>
              <td className="py-3.5 pr-3 text-right">
                <button
                  onClick={() => handleCancelOrder(order.orderId)}
                  disabled={cancellingId === order.orderId}
                  className="p-1 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancel order"
                >
                  {cancellingId === order.orderId ? (
                    <RiLoader2Fill className="animate-spin text-sm" />
                  ) : (
                    <IoClose className="text-base" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RestingOrders;
