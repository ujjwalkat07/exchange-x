"use client";

import { api } from "@/lib/axios";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { OpenPosition } from "@/lib/types";
import { RootState } from "@/store/store";
import { changeOrder } from "@/store/features/orderSlice";
import { IoClose } from "react-icons/io5";
import { RiLoader2Fill } from "react-icons/ri";

interface MarkPrice {
  s: string; // Symbol
  p: string; // Mark price
}

const OpenOrder = () => {
  const [data, setData] = useState<OpenPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  
  const isChanging = useSelector((state: RootState) => state.order.orderCountStatus);
  const isSocketChanging = useSelector((state: RootState) => state.socket.status);
  const dispatch = useDispatch();

  // Load open positions
  useEffect(() => {
    const fetchOpenPositions = async () => {
      try {
        const res = await api.get("/api/order/openPositions");
        setData(res.data.data);

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

  // Connect to Binance Futures Mark Price stream to compute live PnL
  useEffect(() => {
    const ws = new WebSocket("wss://fstream.binance.com/market/stream?streams=!markPrice@arr");

    ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const prices = payload?.data;
        if (!Array.isArray(prices)) return;

        const priceMap: Record<string, number> = {};
        prices.forEach((item: MarkPrice) => {
          priceMap[item.s.toUpperCase()] = Number(item.p);
        });

        setLivePrices((prev) => ({ ...prev, ...priceMap }));
      } catch (err) {
        // Silent error to prevent console spam
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Cancel/Close Order handler
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
      <table className="w-full min-w-[1100px] text-xs text-slate-200">
        <thead>
          <tr className="text-slate-500 border-b border-slate-800 text-left">
            <th className="pb-3 pl-3 font-medium">Symbol</th>
            <th className="pb-3 font-medium">Side</th>
            <th className="pb-3 font-medium">Quantity</th>
            <th className="pb-3 font-medium">Avg fill price</th>
            <th className="pb-3 font-medium">Last price</th>
            <th className="pb-3 font-medium">Unrealized PnL</th>
            <th className="pb-3 font-medium">Unrealized PnL %</th>
            <th className="pb-3 font-medium">Trade value</th>
            <th className="pb-3 font-medium">Market value</th>
            <th className="pb-3 pr-3 text-right font-medium">Action</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={13} className="text-center py-12 text-slate-500 text-sm">
                {error || "No open positions"}
              </td>
            </tr>
          )}

          {data.map((order) => {
            const symbolUpper = order.currencyPair.toUpperCase();
            const currentPrice = livePrices[symbolUpper] || Number(order.entryPrice);
            const entryPrice = Number(order.entryPrice);
            const quantity = Number(order.orderQuantity);

            // Calculate Unrealized PnL
            let unrealizedPnL = 0;
            if (order.orderSide === "BUY") {
              unrealizedPnL = (currentPrice - entryPrice) * quantity;
            } else {
              unrealizedPnL = (entryPrice - currentPrice) * quantity;
            }

            const tradeValue = quantity * entryPrice;
            const marketValue = quantity * currentPrice;
            const pnlPercent = tradeValue > 0 ? (unrealizedPnL / tradeValue) * 100 : 0;

            const isPnLPositive = unrealizedPnL >= 0;
            const pnlColorClass = isPnLPositive ? "text-emerald-400" : "text-red-400";
            const pnlPrefix = isPnLPositive ? "+" : "";

            return (
              <tr
                key={order.orderId}
                className="border-b border-slate-900/60 hover:bg-slate-900/40 transition-colors items-center"
              >
                {/* Symbol Tag */}
                <td className="py-3.5 pl-3">
                  <span className="bg-blue-600/10 text-blue-400 border border-blue-600/30 px-2 py-0.5 rounded text-[10px] font-bold font-sans">
                    {symbolUpper}
                  </span>
                </td>

                {/* Side */}
                <td className="py-3.5 font-semibold">
                  <span className={order.orderSide === "BUY" ? "text-emerald-400" : "text-red-400"}>
                    {order.orderSide === "BUY" ? "BUY" : "SELL"}
                  </span>
                </td>

                {/* Quantity */}
                <td className="py-3.5">{quantity.toFixed(4)}</td>

                {/* Avg Fill Price */}
                <td className="py-3.5">${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                {/* Last Price */}
                <td className="py-3.5">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                {/* Unrealized PnL */}
                <td className={`py-3.5 font-bold ${pnlColorClass}`}>
                  {pnlPrefix}{unrealizedPnL.toFixed(2)} <span className="text-[9px] font-normal text-slate-500">USDT</span>
                </td>

                {/* Unrealized PnL % */}
                <td className={`py-3.5 font-bold ${pnlColorClass}`}>
                  {pnlPrefix}{pnlPercent.toFixed(2)}%
                </td>

                {/* Trade Value */}
                <td className="py-3.5">${tradeValue.toFixed(2)} <span className="text-[9px] text-slate-500">USD</span></td>

                {/* Market Value */}
                <td className="py-3.5">${marketValue.toFixed(2)} <span className="text-[9px] text-slate-500">USD</span></td>

                {/* Close Action Button */}
                <td className="py-3.5 pr-3 text-right">
                  <button
                    onClick={() => handleCancelOrder(order.orderId)}
                    disabled={cancellingId === order.orderId}
                    className="p-1 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Close position"
                  >
                    {cancellingId === order.orderId ? (
                      <RiLoader2Fill className="animate-spin text-sm" />
                    ) : (
                      <IoClose className="text-base" />
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OpenOrder;