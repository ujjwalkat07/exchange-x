"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api } from "@/lib/axios";
import { useDispatch } from "react-redux";
import { setAuthenticated, logout as reduxLogout } from "@/store/features/authSlice";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  userName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialAuthToken,
}: {
  children: React.ReactNode;
  initialAuthToken?: string | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    Boolean(initialAuthToken),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const dispatch = useDispatch();

  const verifyAuth = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/verify-token");
      const userData = response.data?.data || null;
      setUser(userData);
      setIsAuthenticated(true);
      dispatch(setAuthenticated(true));
      return true;
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      dispatch(setAuthenticated(false));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post("/api/auth/login", { email, password });
      await verifyAuth();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      dispatch(reduxLogout());
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        verifyAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
