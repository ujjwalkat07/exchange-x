"use client";
import { changeOrder } from "@/store/features/orderSlice";
import { RootState } from "@/store/store";
import { api } from "@/lib/axios";
import axios from "axios";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RiLoader2Fill } from "react-icons/ri";

const success: string = "false";
const OrderBlock = () => {
  const [state, setState] = useState("BUY");
  const [amount, setAmount] = useState<number>(0);
  const [qty, setQty] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const params = useParams();
  const asset = String(params.currency).toUpperCase().replace("USDT", "");

  const walletData = useSelector((state: RootState) => state.wallet.data);

  const usdtBalance = Number(walletData?.asset1).toFixed(3) ?? 0;
  const tokenBalance = Number(walletData?.asset2).toFixed(3) ?? 0;

  const buyHandler = async () => {
    try {
      setLoading(true);
      await api.post("/api/order/buyorder", {
        currencyPair: params.currency,
        orderSide: "BUY",
        orderType: "Market",
        entryPrice: 3000,
        positionStatus: "Open",
        orderAmount: amount,
      });
      dispatch(changeOrder());
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Login failed");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const sellHandler = async () => {
    try {
      setLoading(true);
      await api.post("/api/order/sellorder", {
        currencyPair: params.currency,
        orderSide: "SELL",
        orderType: "Market",
        entryPrice: 3000,
        positionStatus: "Open",
        orderQuantity: qty,
      });
      dispatch(changeOrder());
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Login failed");
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
        <div className="w-full py-5 px-3 text-white bg-[#0b0e11] mt-2">
          <h1 className="">Exchange / Spot</h1>
          <hr className="text-gray-700 mt-1" />
          <div className="text-white text-xs flex justify-around items-center border border-gray-700 mt-5 rounded-sm">
            <div className="bg-gray-800 py-3 flex-1 text-center rounded-l-sm cursor-pointer">
              BUY
            </div>
            <button onClick={() => setState("SELL")} className="flex-1 cursor-pointer">
              <div className="py-3 text-center rounded-r-sm">SELL</div>
            </button>
          </div>
          <div className="flex gap-5 mt-2">
            <p className="mt-3 text-gray-100 text-sm font-semibold">Market</p>
            <p className="mt-3 text-gray-400 text-sm font-semibold">Limit</p>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="bg-gray-800 flex gap-1 justify-between items-center rounded-sm text-xs text-gray-500 mt-3">
              <p className="font-semibold p-3">Price</p>
              <p className="font-semibold p-3">Market Price</p>
            </div>

            <div className="border border-gray-400 flex justify-between items-center rounded-sm text-xs focus-within:border focus-within:border-emerald-400 mt-3">
              <input
                type="number"
                placeholder="Total"
                className="p-3 text-gray-300 outline-none w-full min-w-0"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <p className="text-white font-semibold p-3 shrink-0">USDT</p>
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-5">
            <p className="">Available Margin</p>
            <p className="">{usdtBalance} USDT</p>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <p className="">Max Qty.</p>
            <p className="">32500 USDT</p>
          </div>
          <div className="flex justify-evenly items-center gap-1 mt-5">
            <button
              onClick={buyHandler}
              className="bg-emerald-500 py-3 w-full rounded-sm text-white font-semibold hover:scale-105 cursor-pointer text-sm"
            >
              {loading ? (
                <div className="flex justify-center items-center gap-3">
                  <RiLoader2Fill className="text-xl" />
                  Order Placing...
                </div>
              ) : (
                <>BUY</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full py-5 px-3 text-white bg-[#0b0e11] mt-2">
          <h1 className="">Exchange / Spot</h1>
          <hr className="text-gray-700 mt-1" />
          <div className="text-white text-xs flex justify-around items-center border border-gray-700 mt-5 rounded-sm">
            <button onClick={() => setState("BUY")} className="flex-1 cursor-pointer">
              <div className="py-3 text-center rounded-l-sm">BUY</div>
            </button>
            <div className="bg-gray-800 flex-1 text-center py-3 rounded-r-sm cursor-pointer">
              SELL
            </div>
          </div>
          <div className="flex gap-5 mt-2">
            <p className="mt-3 text-gray-100 text-sm font-semibold">Market</p>
            <p className="mt-3 text-gray-400 text-sm font-semibold">Limit</p>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="bg-gray-800 flex gap-1 justify-between items-center rounded-sm text-xs text-gray-500 mt-3">
              <p className="font-semibold p-3">Price</p>
              <p className="font-semibold p-3">Market Price</p>
            </div>

            <div className="border border-gray-400 flex justify-between items-center rounded-sm text-xs focus-within:border focus-within:border-red-400 mt-3">
              <input
                type="number"
                placeholder="Total"
                className="p-3 text-gray-300 outline-none w-full min-w-0"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <p className="text-white font-semibold p-3 shrink-0">USDT</p>
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-5">
            <p className="">Available Margin</p>
            <p className="">
              {tokenBalance} {asset}
            </p>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <p className="">Max Qty.</p>
            <p className="">32500 USDT</p>
          </div>
          <div className="flex justify-evenly items-center gap-1 mt-5">
            <button
              onClick={sellHandler}
              className="bg-red-500 py-3 w-full rounded-sm text-white font-semibold hover:scale-105 cursor-pointer text-sm"
            >
              {loading ? (
                <div className="flex justify-center items-center gap-3">
                  <RiLoader2Fill className="text-xl" />
                  Order Placing...
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