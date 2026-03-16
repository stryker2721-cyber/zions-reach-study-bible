import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Admin credentials
const ADMIN_USERNAME = "SNL2721";
const ADMIN_PASSWORD = "Fearknot14!";

export interface User {
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = "owb_users";
const SESSION_KEY = "owb_session";

async function getUsers(): Promise<Record<string, { password: string; email: string; createdAt: string }>> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function saveUsers(users: Record<string, { password: string; email: string; createdAt: string }>) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((raw) => {
      if (raw) setUser(JSON.parse(raw));
      setIsLoading(false);
    });
  }, []);

  const login = async (username: string, password: string) => {
    // Admin check
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const u: User = { username: ADMIN_USERNAME, email: "admin@owb.app", isAdmin: true, createdAt: "2024-01-01" };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u));
      setUser(u);
      return { success: true };
    }
    // Regular user check
    const users = await getUsers();
    const record = users[username.toLowerCase()];
    if (!record) return { success: false, error: "Username not found" };
    if (record.password !== password) return { success: false, error: "Incorrect password" };
    const u: User = { username, email: record.email, isAdmin: false, createdAt: record.createdAt };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
    return { success: true };
  };

  const signup = async (username: string, email: string, password: string) => {
    if (!username.trim() || !email.trim() || !password.trim()) return { success: false, error: "All fields required" };
    if (username === ADMIN_USERNAME) return { success: false, error: "Username not available" };
    const users = await getUsers();
    if (users[username.toLowerCase()]) return { success: false, error: "Username already taken" };
    users[username.toLowerCase()] = { password, email, createdAt: new Date().toISOString() };
    await saveUsers(users);
    const u: User = { username, email, isAdmin: false, createdAt: new Date().toISOString() };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
    return { success: true };
  };

  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
