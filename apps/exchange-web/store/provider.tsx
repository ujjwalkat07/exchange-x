// components/Providers.tsx
"use client";
import { setAuthenticated } from "@/store/features/authSlice";
import type { AppDispatch } from "@/store/store";
import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { api } from "../lib/axios";
import { store } from "./store";

function AuthHydrator({ payload }: { payload: string | null }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(setAuthenticated(Boolean(payload)));

    const verify = async () => {
      try {
        await api.post("/api/auth/verify-token");
        dispatch(setAuthenticated(true));
      } catch {
        dispatch(setAuthenticated(false));
      }
    };

    verify();
  }, [dispatch, payload]);

  return null;
}

export default function Providers({
  children,
  payload,
}: {
  children: React.ReactNode;
  payload: string | null;
}) {
  return (
    <Provider store={store}>
      <AuthHydrator payload={payload} />
      {children}
    </Provider>
  );
}
