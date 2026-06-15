"use client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import {useLayoutEffect, useState } from "react";
import axios from "axios";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await api.post("/api/auth/verify-token");
        if (res.data.statusCode === 200) {
          router.push("/in/spot/btcusdt");
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          router.push("/in/auth/login");
          setError(
            error.response?.data?.message || "Login failed. Please try again.",
          );
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    };
    verifyToken();
  }, [router]);

  return <>{children}</>;
}
