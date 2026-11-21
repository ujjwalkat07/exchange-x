"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Check,
} from "lucide-react";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/api/auth/signup", {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      try {
        await login(email.trim(), password);
        router.push("/in/spot/btcusdt");
      } catch {
        router.push("/in/auth/login?registered=true");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Registration failed. An account with this email may already exist.",
        );
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = password.length >= 6;

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[#0c0e12]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/60">
      <div className="grid grid-cols-2 p-1 mb-6 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-medium">
        <Link
          href="/in/auth/login"
          className="py-2 text-center rounded-md text-zinc-400 hover:text-white transition-colors"
        >
          Log In
        </Link>
        <div className="py-2 text-center rounded-md bg-zinc-800 text-white font-semibold shadow-sm">
          Register
        </div>
      </div>

      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-inner">
          <span className="font-bold text-sm tracking-wider text-white">
            CX
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Create Account
        </h1>

      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Full Name
          </label>
          <div className="relative flex items-center rounded-lg bg-zinc-900/60 border border-zinc-800 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
            <div className="pl-3.5 pr-2 text-zinc-500">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Satoshi Nakamoto"
              autoComplete="name"
              required
              className="w-full bg-transparent py-2.5 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Email address
          </label>
          <div className="relative flex items-center rounded-lg bg-zinc-900/60 border border-zinc-800 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
            <div className="pl-3.5 pr-2 text-zinc-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
              className="w-full bg-transparent py-2.5 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Password
          </label>
          <div className="relative flex items-center rounded-lg bg-zinc-900/60 border border-zinc-800 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
            <div className="pl-3.5 pr-2 text-zinc-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              required
              className="w-full bg-transparent py-2.5 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
                isPasswordValid
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 text-zinc-600"
              }`}
            >
              <Check className="w-2.5 h-2.5" />
            </div>
            <span
              className={
                isPasswordValid ? "text-emerald-400" : "text-zinc-500"
              }
            >
              At least 6 characters
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-relaxed animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-white hover:scale-105 active:bg-emerald-600 text-black font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Creating account…</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/in/auth/login"
          className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Signup;
