"use client";
import LivePrices from "@/components/dashboard/LivePricesTab";
import Orderbook from "@/components/dashboard/OrderBook";
import OrderBlock from "@/components/dashboard/OrderBlock";
import TradingViewWidget from "@/components/dashboard/TradingViewWidget";
import Ticker from "@/components/dashboard/Ticker";
import WalletContainer from "@/components/dashboard/WalletContainer";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import OrderHistory from "@/components/dashboard/TradeContainer/order-history";
import OpenOrder from "@/components/dashboard/TradeContainer/positions";
import RestingOrders from "@/components/dashboard/TradeContainer/open-orders";
import Holding from "@/components/dashboard/TradeContainer/Holding";
import TradeHistory from "@/components/dashboard/TradeContainer/trade-history";
import { useParams } from "next/navigation";
import { changeSocketStatus } from "@/store/features/socketSlice";
import { IoIosCloseCircle } from "react-icons/io";

export default function Home() {
  const [messages, setMessages] = useState<string | null>(null);
  const params = useParams();
  const [activeTab, setActiveTab] = useState<
    "POSITION" | "OPENORDER" | "ORDER_HISTORY" | "TRADE_HISTORY" | "BALANCE_HISTORY"
  >("POSITION");

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between w-full mt-4 px-4 gap-4 bg-[#0b0e11] py-3 rounded-md border border-slate-800">
        <div className="flex-grow w-full lg:w-auto">
          <Ticker token={String(params.currency)} />
        </div>
        <div className="shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
          <WalletContainer />
        </div>
      </div>
      <hr className="border-slate-800 mt-2" />
      <div className="flex flex-col lg:flex-row gap-4 mt-4 px-4">
        {/* Left Sidebar on desktop, stacked below chart/order-form on mobile/tablet */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col md:flex-row lg:flex-col gap-4 order-3 lg:order-1">
          <div className="flex-1 w-full">
            <Orderbook />
          </div>
          <div className="flex-1 w-full">
            <LivePrices />
          </div>
        </div>

        {/* Main Content (Chart, Order Block, Tabs) */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 order-1 lg:order-2">
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* Chart Container */}
            <div className="flex-grow min-w-0 h-[480px] bg-[#0b0e11] rounded-sm border border-slate-800">
              <TradingViewWidget symbol={String(params.currency)} />
            </div>

            {/* Order Block Container */}
            <div className="w-full md:w-80 shrink-0">
              <OrderBlock />
            </div>
          </div>

          <div className="w-full text-white bg-[#0b0e11] rounded-sm p-5 min-h-92 border border-slate-800">
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-400 pb-3 border-b border-slate-900/60 mb-4">
              <button
                onClick={() => setActiveTab("POSITION")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === "POSITION" ? "bg-slate-200 text-slate-950 font-bold" : "bg-slate-900/40 border border-slate-800 hover:text-white"
                }`}
              >
                <span className="cursor-pointer">position</span>
              </button>

              <button
                onClick={() => setActiveTab("OPENORDER")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === "OPENORDER" ? "bg-slate-200 text-slate-950 font-bold" : "bg-slate-900/40 border border-slate-800 hover:text-white"
                }`}
              >
                <span className="cursor-pointer">openorder</span>
              </button>

              <button
                onClick={() => setActiveTab("ORDER_HISTORY")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === "ORDER_HISTORY" ? "bg-slate-200 text-slate-950 font-bold" : "bg-slate-900/40 border border-slate-800 hover:text-white"
                }`}
              >
                <span className="cursor-pointer">order history</span>
              </button>

              <button
                onClick={() => setActiveTab("TRADE_HISTORY")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === "TRADE_HISTORY" ? "bg-slate-200 text-slate-950 font-bold" : "bg-slate-900/40 border border-slate-800 hover:text-white"
                }`}
              >
                <span className="cursor-pointer">trade history</span>
              </button>

              <button
                onClick={() => setActiveTab("BALANCE_HISTORY")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === "BALANCE_HISTORY" ? "bg-slate-200 text-slate-950 font-bold" : "bg-slate-900/40 border border-slate-800 hover:text-white"
                }`}
              >
                <span className="cursor-pointer">balance history</span>
              </button>
            </div>

            {activeTab === "POSITION" && <OpenOrder />}
            {activeTab === "OPENORDER" && <RestingOrders />}
            {activeTab === "ORDER_HISTORY" && <OrderHistory />}
            {activeTab === "TRADE_HISTORY" && <TradeHistory />}
            {activeTab === "BALANCE_HISTORY" && <Holding />}
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
      </div>
    </>
  );
}