"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "./api";

interface User {
  id: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  firstName?: string;
  lastName?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("medinote_token");
    const storedUser = localStorage.getItem("medinote_user");
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ user: User } & AuthTokens>("/auth/login", {
      email,
      password,
    });
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem("medinote_token", res.accessToken);
    localStorage.setItem("medinote_refresh", res.refreshToken);
    localStorage.setItem("medinote_user", JSON.stringify(res.user));
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.post<{ user: User } & AuthTokens>("/auth/register", data);
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem("medinote_token", res.accessToken);
    localStorage.setItem("medinote_refresh", res.refreshToken);
    localStorage.setItem("medinote_user", JSON.stringify(res.user));
  }, []);

  const logout = useCallback(() => {
    if (token) {
      api.post("/auth/logout", {}, { token }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("medinote_token");
    localStorage.removeItem("medinote_refresh");
    localStorage.removeItem("medinote_user");
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
