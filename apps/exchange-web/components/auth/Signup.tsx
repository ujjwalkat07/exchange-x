"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/axios";
import { IoMdLogIn } from "react-icons/io";
import { CiLogin } from "react-icons/ci";
import { RiLoader2Fill } from "react-icons/ri";
import { MdEmail } from "react-icons/md";
import { MdOutlinePassword } from "react-icons/md";
import { MdDriveFileRenameOutline } from "react-icons/md";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setfullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const SignupHandler = async () => {
    if (!email || !password || !fullName) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/signup", { email, password, fullName });
      router.push("/in/spot/btcusdt");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message || "Login failed. Please try again.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black text-slate-50">
      <div className="w-full max-w-sm rounded-xl p-8 bg-gray-950 border border-slate-800">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 bg-slate-50 text-blue-950">
            <IoMdLogIn className="text-3xl" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">
            Welcome!
          </h1>
          <p className="text-sm mt-1 text-slate-400">Create your account</p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-400">
              Full Name
            </label>
            <div className="flex items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors bg-slate-900 border border-slate-800">
              <MdDriveFileRenameOutline className="text-gray-500" />
              <input
                type="fullName"
                placeholder="john doe"
                value={fullName}
                onChange={(e) => setfullName(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600 text-slate-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-400">
              Email address
            </label>
            <div className="flex items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors bg-slate-900 border border-slate-800">
              <MdEmail className="text-gray-500" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600 text-slate-50"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400">
                Password
              </label>
            </div>
            <div className="flex items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors bg-slate-900 border border-slate-800">
              <MdOutlinePassword />

              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600 text-slate-50"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md px-3 py-2.5 text-xs bg-[hsl(0_72.2%_50.6%/0.1)] border border-[hsl(0_72.2%_50.6%/0.3)] text-[hsl(0_72.2%_65%)]">
              <RiLoader2Fill />
              {error}
            </div>
          )}

          <button
            onClick={SignupHandler}
            disabled={loading}
            className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-opacity mt-1 disabled:opacity-60 disabled:cursor-not-allowed bg-slate-50 text-blue-950"
          >
            {loading ? (
              <>
                <RiLoader2Fill />
                Signing in…
              </>
            ) : (
              <>
                <CiLogin className="text-2xl" />
                Sign up
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-600">or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href="/in/auth/login"
            className="font-medium transition-colors text-slate-50"
          >
            Login now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
