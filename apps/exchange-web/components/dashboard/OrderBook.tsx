import { RootState } from "@/store/store";
import { api } from "@/lib/axios";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";

type OrderBookItem = {
  value: string;
  score: number;
};

const Orderbook = () => {
  const [buyData, setBuyData] = useState<OrderBookItem[]>([]);
  const [sellData, setSellData] = useState<OrderBookItem[]>([]);
  const [error, setError] = useState("");
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<
    "up" | "down" | "neutral"
  >("neutral");
  const prevPriceRef = useRef<number | null>(null);
  const param = useParams();
  const currency = String(param.currency ?? "");
  const orderCount = useSelector(
    (state: RootState) => state.order.orderCountStatus,
  );
  const isChanging = useSelector((state: RootState) => state.socket.status);

  // Fetch orderbook data
  useEffect(() => {
    if (!currency) return;
    const fetchData = async () => {
      try {
        const buyRes = await api.get(
          `/api/order-book/buy-order-book/${currency}`,
          {
            params: { t: Date.now() },
            headers: { "Cache-Control": "no-cache" },
          },
        );
        const sellRes = await api.get(
          `/api/order-book/sell-order-book/${currency}`,
          {
            params: { t: Date.now() },
            headers: { "Cache-Control": "no-cache" },
          },
        );
        setBuyData(buyRes.data.book);
        setSellData(sellRes.data.book);
        setError("");
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError(
            error.response?.data?.message || "Failed to fetch orderbook",
          );
        } else {
          setError("Something went wrong");
        }
      }
    };
    fetchData();
  }, [currency, isChanging, orderCount]);

  // Live price WebSocket
  useEffect(() => {
    if (!currency) return;
    const symbol = currency.toLowerCase();
    const ws = new WebSocket(
      `wss://fstream.binance.com/market/stream?streams=${symbol}@ticker`,
    );

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const price = parseFloat(data?.data?.c);
        if (isNaN(price)) return;

        const prev = prevPriceRef.current;
        if (prev !== null) {
          if (price > prev) setPriceDirection("up");
          else if (price < prev) setPriceDirection("down");
          else setPriceDirection("neutral");
        }
        prevPriceRef.current = price;
        setLivePrice(price);
      } catch (err) {
        console.error("Price parse error:", err);
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => ws.close();
  }, [currency]);

  const formattedPrice =
    livePrice !== null
      ? livePrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";

  const priceColorClass =
    priceDirection === "up"
      ? "text-emerald-400"
      : priceDirection === "down"
        ? "text-red-400"
        : "text-white";

  const arrowIcon =
    priceDirection === "up" ? "▲" : priceDirection === "down" ? "▼" : "";

  return (
    <>
      <div className="px-2 py-5 h-max text-white bg-[#0b0e11] mt-2 rounded-sm w-full">
        <h1 className="mx-3">Orderbook</h1>
        <hr className="text-gray-700 mt-2 mx-2" />

        {error && <p className="text-red-400 text-xs px-3 py-2">{error}</p>}

        <div className="max-h-90 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-black">
              <tr className="text-slate-500">
                <th className="px-3 py-1.5 text-left font-medium min-w-8">
                  Price
                </th>
                <th className="px-3 py-1.5 text-right font-medium min-w-8">
                  QTY
                </th>
                <th className="px-3 py-1.5 text-right font-medium min-w-8">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {buyData.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-slate-600"
                  >
                    {error ? "Failed to load" : "No results. Waiting for data…"}
                  </td>
                </tr>
              ) : (
                buyData.map((item) => {
                  const qty = item.value.split("|");
                  const quantity = Number(qty[2]);
                  const amount = (quantity * Number(item.score)).toFixed(2);

                  return (
                    <tr
                      key={item.value}
                      className="border-b border-slate-900 hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="px-3 py-2 text-emerald-400 font-medium">
                        {item.score.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 text-right  text-slate-300">
                        {quantity.toFixed(5)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-300">
                        {amount}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Live Price Display */}
          <div className="py-3 px-3 flex items-center gap-2 border-y border-slate-800/60">
            <span
              className={`font-bold text-2xl ${priceColorClass} transition-colors duration-300`}
            >
              {formattedPrice}
            </span>
            {arrowIcon && (
              <span className={`text-sm ${priceColorClass}`}>{arrowIcon}</span>
            )}
            <span className="text-slate-500 text-xs ml-auto">
              {currency.toUpperCase()}
            </span>
          </div>

          {/* sell order book */}
          <table className="w-full text-xs">
            <tbody>
              {sellData.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-slate-600"
                  >
                    {error ? "Failed to load" : "No results. Waiting for data…"}
                  </td>
                </tr>
              ) : (
                sellData.map((item) => {
                  const qty = item.value.split("|");
                  const quantity = Number(qty[2]);
                  const amount = (quantity * Number(item.score)).toFixed(2);

                  return (
                    <tr
                      key={item.value}
                      className="border-b border-slate-900 hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="px-3 py-2 text-red-400  font-medium">
                        {item.score.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 text-right  text-slate-300">
                        {quantity.toFixed(5)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-300">
                        {amount}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Orderbook;
