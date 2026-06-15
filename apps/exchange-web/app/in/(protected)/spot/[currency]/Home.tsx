"use client";
import LivePrices from "@/components/dashboard/LivePricesTab";
import Orderbook from "@/components/dashboard/OrderBook";
import OrderBlock from "@/components/dashboard/OrderBlock";
import TradingViewWidget from "@/components/dashboard/TradingViewWidget";
import Ticker from "@/components/dashboard/Ticker";
import WalletContainer from "@/components/dashboard/WalletContainer";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import OrderHistory from "@/components/dashboard/TradeContainer/OrderHistory";
import OpenOrder from "@/components/dashboard/TradeContainer/OpenOrder";
import TradeHistory from "@/components/dashboard/TradeContainer/TradeHistory";
import { useParams } from "next/navigation";
import { changeSocketStatus } from "@/store/features/socketSlice";
import { IoIosCloseCircle } from "react-icons/io";

export default function Home() {
  const [messages, setMessages] = useState<string | null>(null);
  const params = useParams();
  const [activeTab, setActiveTab] = useState<
    "OPEN_ORDER" | "ORDER_HISTORY" | "TRADE_HISTORY" | "HOLDING"
  >("OPEN_ORDER");

  const dispatch = useDispatch();

  useEffect(() => {
    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET}`);
    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onmessage = ({ data }) => {
      const { event, message } = JSON.parse(data);
      console.log("Received message:", event, message);
      if (event === "order") {
        setMessages(message);
        dispatch(changeSocketStatus());
      } else {
        dispatch(changeSocketStatus());
      }

      setTimeout(() => {
        setMessages(null);
      }, 2000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socket.close();
    };
  }, [dispatch]);

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-center w-full mt-5 px-1 gap-3">
        <Ticker token={String(params.currency)} />
        <div className="shrink-0">
          <WalletContainer />
        </div>
      </div>
      <hr className="text-gray-700 mt-2" />
      <div className="flex flex-col xl:flex-row xl:justify-around">
        <div className="flex flex-col mx-3 xl:mx-3">
          <div className="lg:block hidden">
            <Orderbook />
          </div>
          <hr className="text-gray-700 mt-2" />
          <div className="lg:block hidden">
            <LivePrices />
          </div>
        </div>

        <div className="hidden xl:block border-r border-r-gray-600 h-202"></div>
        <div className="mx-2 flex-1 min-w-0">
          <div className="flex flex-col lg:flex-row lg:justify-around lg:gap-3">
            {/* Chart — full width on mobile, min 50% on lg+ */}
            <div className="w-full lg:min-w-[50%] flex justify-center">
              <TradingViewWidget symbol={"btcusdt"} />
            </div>

            <div className="hidden lg:block border-r border-r-gray-600 h-106"></div>

            <div className="w-full lg:w-[50%] lg:min-w-0 lg:max-w-full">
              <OrderBlock />
            </div>
          </div>

          <hr className="text-gray-700 mt-2" />

          <div className="w-full text-white mt-2 bg-[#0b0e11] rounded-sm p-5 mb-5 min-h-92">
            <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-400">
              <button
                onClick={() => setActiveTab("OPEN_ORDER")}
                className={activeTab === "OPEN_ORDER" ? "text-white" : ""}
              >
                <p className="cursor-pointer">Open Order</p>
              </button>

              <button
                onClick={() => setActiveTab("ORDER_HISTORY")}
                className={activeTab === "ORDER_HISTORY" ? "text-white" : ""}
              >
                <p className="cursor-pointer">Order History</p>
              </button>

              <button
                onClick={() => setActiveTab("TRADE_HISTORY")}
                className={activeTab === "TRADE_HISTORY" ? "text-white cursor-pointer" : ""}
              >
                <p className="cursor-pointer">Trade History</p>
              </button>

              <button
                onClick={() => setActiveTab("HOLDING")}
                className={activeTab === "HOLDING" ? "text-white cursor-pointer" : ""}
              >
                <p className="cursor-pointer">Holding</p>
              </button>
            </div>

            {activeTab === "OPEN_ORDER" && <OpenOrder />}
            {activeTab === "ORDER_HISTORY" && <OrderHistory />}
            {activeTab === "TRADE_HISTORY" && <TradeHistory />}
          </div>
        </div>
      </div>

      {messages && (
        <div className="fixed border-b-4 min-w-64 justify-center bottom-6 right-4 sm:top-[90%] sm:left-[90%] sm:-translate-x-1/2 z-50 bg-emerald-500 text-white px-2 py-5 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
          <span className="text-sm font-semibold">{messages}</span>
          <button
            onClick={() => setMessages(null)}
            className="text-white hover:text-gray-200 text-lg leading-none"
          >
            <IoIosCloseCircle />
          </button>
        </div>
      )}
    </>
  );
}