"use client";

import { api } from "@/lib/axios";
import { logout } from "@/store/features/authSlice";
import { resetWalletChange } from "@/store/features/walletSlice";
import { resetOrderChange } from "@/store/features/orderSlice";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";

const Logout = () => {
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();

  const LogoutHandler = async () => {
    try {
      await api.post("/api/auth/logout");
      // Clear all Redux state
      dispatch(logout());
      dispatch(resetWalletChange());
      dispatch(resetOrderChange());
      // Redirect to login
      router.push("/in/auth/login");
    } catch (error) {
      // Clear all Redux state even on error
      dispatch(logout());
      dispatch(resetWalletChange());
      dispatch(resetOrderChange());
      // Redirect to login
      router.push("/in/auth/login");
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message || "Logout failed. Please try again.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <>
      <button onClick={LogoutHandler}>
        {error && <p className="text-red-400 text-xs px-3 py-2">{error}</p>}
        <div className="cursor-pointer px-8 py-1.5 rounded-md text-sm font-medium border border-slate-800 text-white">
          Logout
        </div>
      </button>
    </>
  );
};

export default Logout;
