"use client";

import { changeOrder } from "@/store/features/orderSlice";
import { RootState } from "@/store/store";
import { api } from "@/lib/axios";
import axios from "axios";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RiLoader2Fill } from "react-icons/ri";

const OrderBlock = () => {
  const [state, setState] = useState("BUY"); // "BUY" or "SELL"
  const [orderType, setOrderType] = useState<"Market" | "Limit">("Market");
  const [amount, setAmount] = useState<number>(0);
  const [qty, setQty] = useState<number>(0);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [livePrice, setLivePrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const params = useParams();
  const asset = String(params.currency || "BTCUSDT")
    .toUpperCase()
    .replace("USDT", "");

  const walletData = useSelector((state: RootState) => state.wallet.data);
  const usdtBalance = Number(walletData?.asset1 || 0).toFixed(3);
  const tokenBalance = Number(walletData?.asset2 || 0).toFixed(3);

  // Subscribe to live ticker to pre-populate limit price
  useEffect(() => {
    const symbolUpper = String(params.currency || "BTCUSDT").toUpperCase();
    const ws = new WebSocket(
      `wss://fstream.binance.com/market/stream?streams=${symbolUpper.toLowerCase()}@ticker`,
    );

    ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const ticker = payload?.data;
        if (ticker?.c) {
          const price = Number(ticker.c);
          setLivePrice(price);
        }
      } catch (err) {
        // Silent error
      }
    };

    return () => {
      ws.close();
    };
  }, [params.currency]);

  // Sync limit price with live price on switching tab if limit price is not set
  useEffect(() => {
    if (orderType === "Limit" && limitPrice === 0 && livePrice > 0) {
      setLimitPrice(livePrice);
    }
  }, [orderType, livePrice, limitPrice]);

  const buyHandler = async () => {
    if (amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (orderType === "Limit" && limitPrice <= 0) {
      setError("Please enter a valid limit price.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/order/buyorder", {
        currencyPair: params.currency,
        orderSide: "BUY",
        orderType: orderType,
        entryPrice: orderType === "Limit" ? limitPrice : undefined,
        positionStatus: "Open",
        orderAmount: amount,
      });
      dispatch(changeOrder());
      setAmount(0);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Order failed");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const sellHandler = async () => {
    if (qty <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    if (orderType === "Limit" && limitPrice <= 0) {
      setError("Please enter a valid limit price.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/order/sellorder", {
        currencyPair: params.currency,
        orderSide: "SELL",
        orderType: orderType,
        entryPrice: orderType === "Limit" ? limitPrice : undefined,
        positionStatus: "Open",
        orderQuantity: qty,
      });
      dispatch(changeOrder());
      setQty(0);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Order failed");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {state === "BUY" ? (
        <div className="w-full py-5 px-3 text-white bg-[#0b0e11] mt-2 rounded-sm border border-slate-800">
          <h1 className="text-sm font-semibold">Exchange / Spot</h1>
          <hr className="border-slate-800 mt-1" />

          {/* Buy / Sell selector */}
          <div className="text-white text-xs flex justify-around items-center border border-slate-800 mt-5 rounded-sm overflow-hidden">
            <div className="bg-emerald-500/10 text-emerald-400 border-r border-slate-800 py-3 flex-1 text-center font-bold">
              BUY
            </div>
            <button
              onClick={() => {
                setState("SELL");
                setError("");
              }}
              className="flex-1 cursor-pointer hover:bg-slate-900/50 transition-colors"
            >
              <div className="py-3 text-center text-slate-400">SELL</div>
            </button>
          </div>

          {/* Market / Limit selector */}
          <div className="flex gap-4 mt-3 border-b border-slate-900 pb-2">
            <button
              onClick={() => setOrderType("Market")}
              className={`text-sm font-semibold pb-1 transition-colors ${
                orderType === "Market"
                  ? "text-emerald-400 border-b-2 border-emerald-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType("Limit")}
              className={`text-sm font-semibold pb-1 transition-colors ${
                orderType === "Limit"
                  ? "text-emerald-400 border-b-2 border-emerald-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Limit
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {/* Price Field */}
            {orderType === "Market" ? (
              <div className="bg-slate-900/40 border border-slate-800 flex gap-1 justify-between items-center rounded-sm text-xs text-slate-500 mt-3 p-3">
                <p className="font-semibold">Price</p>
                <p className="font-semibold text-slate-300">Market Price</p>
              </div>
            ) : (
              <div className="border border-slate-800 bg-slate-900/20 flex justify-between items-center rounded-sm text-xs focus-within:border focus-within:border-emerald-400 mt-3">
                <input
                  type="number"
                  placeholder="Price"
                  className="p-3 text-slate-100 bg-transparent outline-none w-full min-w-0 font-mono"
                  value={limitPrice || ""}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                />
                <p className="text-slate-400 font-semibold p-3 shrink-0">
                  USDT
                </p>
              </div>
            )}

            {/* Amount (Total USDT) Field */}
            <div className="border border-slate-800 bg-slate-900/20 flex justify-between items-center rounded-sm text-xs focus-within:border focus-within:border-emerald-400 mt-2">
              <input
                type="number"
                placeholder={orderType === "Limit" ? "Total amount" : "Amount"}
                className="p-3 text-slate-100 bg-transparent outline-none w-full min-w-0 font-mono"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <p className="text-slate-400 font-semibold p-3 shrink-0">USDT</p>
            </div>
          </div>

          <div className="flex justify-between text-xs text-slate-500 mt-5 font-mono">
            <p>Available Balance</p>
            <p className="text-slate-300 font-semibold">{usdtBalance} USDT</p>
          </div>

          {error && (
            <div className="mt-3 text-center text-xs text-red-400 border border-red-500/20 bg-red-500/5 py-2.5 rounded-sm">
              {error}
            </div>
          )}

          <div className="flex justify-evenly items-center gap-1 mt-5">
            <button
              onClick={buyHandler}
              disabled={loading}
              className="bg-emerald-500 py-3 w-full rounded-sm text-white font-semibold hover:scale-[1.02] active:scale-100 transition-all cursor-pointer text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="flex justify-center items-center gap-3">
                  <RiLoader2Fill className="text-xl animate-spin" />
                  Placing order…
                </div>
              ) : (
                <>BUY</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full py-5 px-3 text-white bg-[#0b0e11] mt-2 rounded-sm border border-slate-800">
          <h1 className="text-sm font-semibold">Exchange / Spot</h1>
          <hr className="border-slate-800 mt-1" />

          {/* Buy / Sell selector */}
          <div className="text-white text-xs flex justify-around items-center border border-slate-800 mt-5 rounded-sm overflow-hidden">
            <button
              onClick={() => {
                setState("BUY");
                setError("");
              }}
              className="flex-1 cursor-pointer hover:bg-slate-900/50 transition-colors"
            >
              <div className="py-3 text-center text-slate-400">BUY</div>
            </button>
            <div className="bg-red-500/10 text-red-400 border-l border-slate-800 py-3 flex-1 text-center font-bold">
              SELL
            </div>
          </div>

          {/* Market / Limit selector */}
          <div className="flex gap-4 mt-3 border-b border-slate-900 pb-2">
            <button
              onClick={() => setOrderType("Market")}
              className={`text-sm font-semibold pb-1 transition-colors ${
                orderType === "Market"
                  ? "text-red-400 border-b-2 border-red-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType("Limit")}
              className={`text-sm font-semibold pb-1 transition-colors ${
                orderType === "Limit"
                  ? "text-red-400 border-b-2 border-red-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Limit
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {/* Price Field */}
            {orderType === "Market" ? (
              <div className="bg-slate-900/40 border border-slate-800 flex gap-1 justify-between items-center rounded-sm text-xs text-slate-500 mt-3 p-3">
                <p className="font-semibold">Price</p>
                <p className="font-semibold text-slate-300">Market Price</p>
              </div>
            ) : (
              <div className="border border-slate-800 bg-slate-900/20 flex justify-between items-center rounded-sm text-xs focus-within:border focus-within:border-red-400 mt-3">
                <input
                  type="number"
                  placeholder="Price"
                  className="p-3 text-slate-100 bg-transparent outline-none w-full min-w-0 font-mono"
                  value={limitPrice || ""}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                />
                <p className="text-slate-400 font-semibold p-3 shrink-0">
                  USDT
                </p>
              </div>
            )}

            {/* Quantity Field */}
            <div className="border border-slate-800 bg-slate-900/20 flex justify-between items-center rounded-sm text-xs focus-within:border focus-within:border-red-400 mt-2">
              <input
                type="number"
                placeholder="Quantity"
                className="p-3 text-slate-100 bg-transparent outline-none w-full min-w-0 font-mono"
                value={qty || ""}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <p className="text-slate-400 font-semibold p-3 shrink-0">
                {asset}
              </p>
            </div>
          </div>

          <div className="flex justify-between text-xs text-slate-500 mt-5 font-mono">
            <p>Available Balance</p>
            <p className="text-slate-300 font-semibold">
              {tokenBalance} {asset}
            </p>
          </div>

          {error && (
            <div className="mt-3 text-center text-xs text-red-400 border border-red-500/20 bg-red-500/5 py-2.5 rounded-sm">
              {error}
            </div>
          )}

          <div className="flex justify-evenly items-center gap-1 mt-5">
            <button
              onClick={sellHandler}
              disabled={loading}
              className="bg-red-500 py-3 w-full rounded-sm text-white font-semibold hover:scale-[1.02] active:scale-100 transition-all cursor-pointer text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="flex justify-center items-center gap-3">
                  <RiLoader2Fill className="text-xl animate-spin" />
                  Placing order…
                </div>
              ) : (
                <>SELL</>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderBlock;
