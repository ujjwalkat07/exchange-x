"use client";

import Link from "next/link";

const page = () => {
  const steps = [
    {
      num: "01",
      title: "Create an Account",
      desc: "Sign up in minutes with just your email. No lengthy verification to get started.",
      icon: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      num: "02",
      title: "Deposit Funds",
      desc: "Securely transfer crypto to your wallet. Supports 50+ networks with instant confirmation.",
      icon: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
      ),
    },
    {
      num: "03",
      title: "Start Trading",
      desc: "Access 400+ pairs with advanced charts, limit orders, and real-time market data.",
      icon: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
  ];

  const stats = [
    { label: "Trading Volume", value: "$4.2B", sub: "in the last 24 hours" },
    { label: "Active Users", value: "2.8M", sub: "traders worldwide" },
    { label: "Trading Pairs", value: "400+", sub: "across major chains" },
    { label: "Uptime", value: "99.9%", sub: "platform reliability" },
  ];

  return (
    <div className="min-h-screen font-sans text-sm mt-2 bg-black">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 bg-[url('/close-up-hand-bitcoin-concept.jpg')]" />

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live markets · 400+ pairs
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-5 text-white">
            The Future of
            <br />
            <span className="text-gray-400">Crypto Trading</span> is Here
          </h1>

          <p className="text-base mb-8 max-w-xl mx-auto leading-relaxed text-slate-400">
            Trade 400+ cryptocurrencies with institutional-grade security,
            sub-millisecond execution, and the deepest liquidity on the market.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/in/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold transition-all bg-slate-50 text-slate-950"
            >
              Start Trading Free
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="#markets"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-colors bg-slate-800 text-slate-50 border border-slate-700"
            >
              View Markets
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-slate-600">
            {[
              "SOC 2 Certified",
              "256-bit Encryption",
              "$350M Insurance Fund",
              "Regulated Exchange",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-emerald-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-b border-slate-800">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-800">
          {stats.map((s, i) => (
            <div key={i} className="px-8 py-6 text-center">
              <p className="text-2xl font-bold tracking-tight text-slate-50">
                {s.value}
              </p>
              <p className="text-xs font-medium mt-0.5 text-slate-400">
                {s.label}
              </p>
              <p className="text-xs mt-0.5 text-slate-600">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="py-20 px-6 border-t border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium mb-2 text-slate-600">
              HOW IT WORKS
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-50">
              Get started in 3 easy steps
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              From sign-up to first trade in under 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative rounded-lg p-6 transition-colors bg-slate-950 border border-slate-800"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-2.5 w-5 h-px z-10 bg-slate-700" />
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-slate-800 text-slate-400 border border-slate-700">
                    {step.icon}
                  </div>
                  <span className="text-xs font-mono font-medium mt-2.5 text-slate-600">
                    {step.num}
                  </span>
                </div>

                <h3 className="font-semibold text-sm mb-2 text-slate-50">
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/in/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold bg-slate-50 text-slate-950"
            >
              Create Free Account →
            </Link>
          </div>
        </div>
      </section>


      <footer className="px-6 py-10 mt-10 border-t border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-slate-50 text-slate-950">
                CX
              </div>
              <span className="font-semibold text-sm text-slate-50">
                CryptoExchange
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-white">
              <p className="">About Us</p>
              <p className="">Contact</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6 text-xs border-t border-slate-800 text-slate-600">
            <p>
              © 2026 CryptoExchange Inc. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default page;
