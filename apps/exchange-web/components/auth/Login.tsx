"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoFilled, setDemoFilled] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredSuccess = searchParams.get("registered") === "true";

  const { login } = useAuth();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      router.push("/in/spot/btcusdt");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Invalid credentials. Please verify your email and password.",
        );
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillDemo = () => {
    setEmail("admin@gmail.com");
    setPassword("admin");
    setError("");
    setDemoFilled(true);
    setTimeout(() => {
      setDemoFilled(false);
    }, 2500);
  };

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[#0c0e12]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/60">
      <div className="grid grid-cols-2 p-1 mb-6 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-medium">
        <div className="py-2 text-center rounded-md bg-zinc-800 text-white font-semibold shadow-sm">
          Log In
        </div>
        <Link
          href="/in/auth/signup"
          className="py-2 text-center rounded-md text-zinc-400 hover:text-white transition-colors"
        >
          Register
        </Link>
      </div>

      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-inner">
          <span className="font-bold text-sm tracking-wider text-white">
            CX
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Welcome back
        </h1>

      </div>

      {registeredSuccess && (
        <div className="mb-5 flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs leading-relaxed animate-in fade-in slide-in-from-top-1">
          <span>Account created successfully! Please sign in below.</span>
        </div>
      )}

      <div className="mb-5 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="truncate">
            <span className="text-zinc-500 text-[11px] mr-1">Demo:</span>
            <span className="font-mono text-zinc-300 text-[11px]">
              admin@gmail.com
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAutofillDemo}
          className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-white hover:text-emerald-300 border border-zinc-700/60 transition-colors flex items-center gap-1 cursor-pointer"
        >
          {demoFilled ? (
            <>
              <span>Filled!</span>
            </>
          ) : (
            <>
              <span>Autofill</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Password
            </label>
            <span className="text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors cursor-pointer">
              Forgot password?
            </span>
          </div>
          <div className="relative flex items-center rounded-lg bg-zinc-900/60 border border-zinc-800 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
            <div className="pl-3.5 pr-2 text-zinc-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
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
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/in/auth/signup"
          className="font-medium text-white transition-colors"
        >
          Create one now
        </Link>
      </p>
    </div>
  );
};

export default Login;
