"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useState } from "react";
import Logout from "../auth/Logout";
import { ArrowRight, LayoutDashboard, Activity } from "lucide-react";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { label: "Dashboard", href: "/in/spot/btcusdt" },
    { label: "Markets", href: "/in/market/btcusdt" },
    { label: "Wallet", href: "/in/wallet" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold text-xs tracking-wider">
            CX
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-foreground">
              CryptoExchange
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-foreground transition-colors font-medium text-xs sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/in/spot/btcusdt"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Terminal</span>
              </Link>
              <Logout />
            </div>
          ) : (
            <>
              <Link
                href="/in/auth/login"
                className="text-xs font-medium px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/in/auth/signup"
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 shrink-0 text-foreground"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-px bg-foreground transition-all duration-300 origin-center ${menuOpen ? "translate-y-1 rotate-45" : ""}`}
          />
          <span
            className={`block w-5 h-px bg-foreground transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-px bg-foreground transition-all duration-300 origin-center ${menuOpen ? "-translate-y-1 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-b border-border bg-background/98 ${
          menuOpen ? "max-h-96" : "max-h-0 border-transparent"
        }`}
      >
        <ul className="flex flex-col px-4 pt-3 pb-2 gap-1">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium w-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 px-4 pt-3 pb-4 border-t border-border">
          {isAuthenticated ? (
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/in/spot/btcusdt"
                onClick={() => setMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-foreground text-background text-xs font-medium"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Trading Terminal</span>
              </Link>
              <Logout />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/in/auth/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-md text-xs font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/in/auth/signup"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-md text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Start Trading
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavBar;
