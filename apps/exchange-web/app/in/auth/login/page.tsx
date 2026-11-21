import { Suspense } from "react";
import Login from "@/components/auth/Login";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md h-[480px] rounded-2xl border border-white/[0.08] bg-[#0c0e12]/90 flex items-center justify-center text-zinc-500 text-xs">
          Loading authentication terminal...
        </div>
      }
    >
      <Login />
    </Suspense>
  );
}
