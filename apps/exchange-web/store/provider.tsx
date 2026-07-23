"use client";
import { Provider } from "react-redux";
import { store } from "./store";
import { AuthProvider } from "@/context/AuthContext";

export default function Providers({
  children,
  payload,
}: {
  children: React.ReactNode;
  payload: string | null;
}) {
  return (
    <Provider store={store}>
      <AuthProvider initialAuthToken={payload}>{children}</AuthProvider>
    </Provider>
  );
}

