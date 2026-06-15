"use client";

import { RootState } from "@/store/store";
import Link from "next/link";
import { useState } from "react";
import { useSelector } from "react-redux";
import Logout from "../auth/Logout";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Dashboard", href: "/in/spot/btcusdt" },
    { label: "Wallet", href: "/in/wallet" },
    { label: "Market", href: "/in/market/btcusdt" },
  ];

  const isLoggedIn = useSelector((state: RootState) =>
    Boolean(state.auth.data),
  );
  console.log("isLoggedIn:", isLoggedIn);
  const showAuthButtons = !isLoggedIn;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 ">
          <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold bg-slate-50 text-blue-950">
            CX
          </div>
          <span className="font-semibold text-sm tracking-tight text-slate-50">
            CryptoExchange
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li
              key={link.href}
              className="border bg-slate-900 w-26 text-center p-1 rounded-md"
            >
              <Link
                href={link.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {showAuthButtons ? (
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/in/auth/login"
              className="px-8 py-1.5 rounded-md text-sm font-medium border border-slate-800 text-white"
            >
              Login
            </Link>
            <Link
              href="/in/auth/signup"
              className="px-6 py-1.5 rounded-md text-sm font-semibold hover:opacity-90  bg-slate-50 text-black"
            >
              Sign Up
            </Link>
          </div>
        ) : (
          <Logout />
        )}

        <button
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 shrink-0"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-px bg-slate-50 transition-all duration-300 origin-center ${menuOpen ? "translate-y-1 rotate-45" : ""}`}
          />
          <span
            className={`block w-5 h-px bg-slate-50 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-px bg-slate-50 transition-all duration-300 origin-center ${menuOpen ? "-translate-y-1 -rotate-45" : ""}`}
          />
        </button>
      </nav>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? "max-h-100 border-t border-slate-800" : "max-h-0"}`}
      >
        <ul className="flex flex-col px-4 pt-3 pb-2 gap-0.5">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium w-full transition-colors text-slate-400"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {showAuthButtons && (
          <div className="flex flex-col gap-2 px-4 pt-3 pb-4 border-t border-slate-800">
            <Link
              href="/in/auth/login"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-md text-sm font-medium transition-colors border border-slate-800 text-slate-400"
            >
              Login
            </Link>
            <Link
              href="/in/auth/signup"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity bg-slate-50 text-blue-950"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavBar;
