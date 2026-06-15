"use client";
import { api } from "@/lib/axios";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { OpenPosition } from "@/lib/types";
import { RootState } from "@/store/store";

const OpenOrder = () => {
  const [data, setData] = useState<OpenPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isChanging = useSelector((state: RootState) => state.order.orderCountStatus);
  const isSocketChanging = useSelector(
    (state: RootState) => state.socket.status,
  );

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

  return (
    <div className="w-full overflow-x-auto mt-5">
      <table className="w-full min-w-[600px] px-5 text-sm">
        <thead>
          <tr className="text-gray-500 text-center">
            <th className="min-w-28">ASSET</th>
            <th className="min-w-28">Qty</th>
            <th className="min-w-28">Entry Price</th>
            <th className="min-w-34">Order Id</th>
            <th className="min-w-28">Order Type</th>
            <th className="min-w-28">Status</th>
            <th className="min-w-28">Side</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && !error && (
            <tr>
              <td colSpan={7} className="text-center py-6 text-gray-500">
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
          </tr>
          {data.map((order) => (
            <tr
              key={order.orderId}
              className="text-gray-300 text-center bg-[#12161b] text-sm"
            >
              <td className="py-3">{order.currencyPair}</td>
              <td className="py-3">{Number(order.orderQuantity).toFixed(6)}</td>
              <td className="py-3">{order.entryPrice}</td>
              <td className="py-3">{order.orderId}</td>
              <td className="py-3">{order.orderType}</td>
              <td className="py-3">{order.positionStatus}</td>
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

export default OpenOrder;