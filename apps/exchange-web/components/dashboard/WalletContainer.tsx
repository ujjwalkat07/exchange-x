"use client";

import { changeWalletState } from "@/store/features/walletSlice";
import { RootState } from "@/store/store";
import { api } from "@/lib/axios";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const WalletContainer = () => {
  const param = useParams();
  const asset = String(param.currency).toUpperCase().replace("USDT", "");

  const [balance, setBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [error, setError] = useState("");

  const isSocketChanging = useSelector(
    (state: RootState) => state.socket.status,
  );

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await api.get(
          `/api/wallet/getuserbalance?asset1=USDT&asset2=${asset}`,
        );
        setBalance(Number(res.data.data.asset1));
        setTokenBalance(Number(res.data.data.asset2));

        dispatch(changeWalletState(res.data.data));
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError(error.response?.data?.message || "Login failed");
        } else {
          setError("Something went wrong");
        }
      }
    };
    fetchBalance();
  }, [asset, isSocketChanging, dispatch]);

  return (
    <>
      <div className="flex gap-3">
        <div className="py-3 px-7 rounded-sm bg-[#0b0e11] flex flex-col justify-center items-right">
          <p className="text-sm text-gray-300 ">Market</p>
          <p className="font-bold text-green-300">Open </p>
        </div>
        <div className="py-3 px-4 rounded-sm bg-[#0b0e11] flex flex-col justify-center items-right">
          <p className="text-sm text-gray-300 ">USDT Wallet</p>
          <p className="font-bold text-gray-200">$ {balance.toFixed(2) || 0}</p>
        </div>
        <div className="py-3 px-4  rounded-sm bg-[#0b0e11] flex flex-col justify-center items-right ">
          <p className="text-sm text-gray-300">{asset} Wallet</p>
          <p className="font-bold text-gray-200">
            {tokenBalance.toFixed(3) || 0}{" "}
          </p>
        </div>
      </div>
    </>
  );
};

export default WalletContainer;
