"use client";

import { useAuth } from "@/context/AuthContext";
import { resetWalletChange } from "@/store/features/walletSlice";
import { resetOrderChange } from "@/store/features/orderSlice";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Logout = () => {
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();
  const { logout } = useAuth();

  const LogoutHandler = async () => {
    try {
      await logout();
      dispatch(resetWalletChange());
      dispatch(resetOrderChange());
      router.push("/in/auth/login");
    } catch {
      dispatch(resetWalletChange());
      dispatch(resetOrderChange());
      router.push("/in/auth/login");
      setError("Logout encountered an issue, but you have been logged out locally.");
    }

  };

  return (
    <div>
      {error && <p className="text-red-400 text-xs mb-1">{error}</p>}
      <button
        type="button"
        onClick={LogoutHandler}
        className="cursor-pointer px-8 py-1.5 rounded-md text-sm font-medium border border-slate-800 text-white hover:bg-slate-900 transition-colors"
      >
        Logout
      </button>
    </div>
  );
};

export default Logout;
