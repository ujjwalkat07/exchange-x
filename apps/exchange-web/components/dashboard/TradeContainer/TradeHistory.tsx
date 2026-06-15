"use client";
import { api } from "@/lib/axios";
import { RootState } from "@/store/store";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { OrderHistory } from "@/lib/types";

const TradeHistory = () => {
  const [data, setData] = useState<OrderHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isChanging = useSelector((state: RootState) => state.order.orderCountStatus);
  const isSocketChanging = useSelector(
    (state: RootState) => state.socket.status,
  );

  useEffect(() => {
    const fetchTradeHistory = async () => {
      try {
        const res = await api.get("/api/order-history");
        setData(res.data.data);
        console.log(res.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to load orders");
        } else {
          setError("Something went wrong");
        }
      }
    };

    fetchTradeHistory();
  }, [isChanging, isSocketChanging]);

  return (
    <div className="w-full overflow-x-auto mt-5">
      <table className="w-full min-w-[700px] px-5 text-sm">
        <thead>
          <tr className="text-gray-500 text-center">
            <th className="min-w-28">ASSET</th>
            <th className="min-w-28">Traded QTY</th>
            <th className="min-w-28">Execution Price</th>
            <th className="min-w-28">Order Amount</th>
            <th className="min-w-34">Trade Id</th>
            <th className="min-w-28">Order Type</th>
            <th className="min-w-28">Status</th>
            <th className="min-w-28">Side</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && !error && (
            <tr>
              <td colSpan={8} className="text-center py-6 text-gray-500">
                No open positions
              </td>
            </tr>
          )}
          <tr className="text-gray-300 text-center text-sm">
            <td className="py-1"></td>
            <td className="py-1"></td>
            <td className="py-1"></td>
            <td className="py-1"></td>
            <td className="py-1"></td>
            <td className="py-1"></td>
            <td className="py-1"></td>
            <td className="py-1"></td>
          </tr>
          {data.map((order) => (
            <tr
              key={order.orderId}
              className="text-gray-300 text-center bg-[#12161b] text-sm"
            >
              <td className="py-3">{order.currencyPair}</td>
              <td className="py-3">{Number(order.tradedQuantity).toFixed(6)}</td>
              <td className="py-3">{order.executionPrice}</td>
              <td className="py-3">{order.orderAmount}</td>
              <td className="py-3">{order._id}</td>
              <td className="py-3">Market</td>
              <td className="py-3">{order.status}</td>
              <td
                className={`py-3 ${
                  order.orderSide === "BUY" ? "text-green-400" : "text-red-400"
                }`}
              >
                {order.orderSide}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradeHistory;