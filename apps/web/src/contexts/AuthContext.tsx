"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

export type UserProfile = {
  id: string;
  userId: string;
  fullName: string;
  role: string;
};

type Session = {
  access_token: string;
  refresh_token: string;
  userId: string;
};

type AuthContextValue = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpPayload) => Promise<void>;
  signOut: () => void;
};

export type SignUpPayload = {
  email: string;
  password: string;
  fullName: string;
  role: "USER" | "ADMIN";
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "ahorre:session_v1";
const PROFILE_KEY = "ahorre:profile_v1";
const AUTH_BASE =
  process.env["NEXT_PUBLIC_AUTH_API_URL"] ?? "https://ahorre-auth.vercel.app";
const SUPABASE_URL = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
const SUPABASE_ANON_KEY = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "";
// Refresca 5 minutos antes de que expire
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

async function fetchFromAuth<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${AUTH_BASE}/api/v1${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = (await res.json()) as { data: T; message: string };
  if (!res.ok)
    throw new Error((json as unknown as { message: string }).message ?? `HTTP ${res.status}`);
  return json.data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setSession(null);
    setProfile(null);
  }, []);

  // Refresca el access_token usando el refresh_token de Supabase
  const refreshSession = useCallback(
    async (current: Session): Promise<Session | null> => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ refresh_token: current.refresh_token }),
          }
        );
        if (!res.ok) {
          signOut();
          return null;
        }
        const data = (await res.json()) as { access_token: string; refresh_token: string };
        const next: Session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          userId: current.userId,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(next));
        setSession(next);
        return next;
      } catch {
        signOut();
        return null;
      }
    },
    [signOut]
  );

  // Carga sesión inicial y refresca si ya expiró
  useEffect(() => {
    const rawSession = localStorage.getItem(SESSION_KEY);
    const rawProfile = localStorage.getItem(PROFILE_KEY);

    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession) as Session;
        const decoded = jwtDecode<{ exp: number }>(parsed.access_token);
        if (decoded.exp * 1000 > Date.now()) {
          setSession(parsed);
          if (rawProfile) setProfile(JSON.parse(rawProfile) as UserProfile);
        } else {
          void refreshSession(parsed).then((next) => {
            if (!next) {
              localStorage.removeItem(SESSION_KEY);
              localStorage.removeItem(PROFILE_KEY);
            } else if (rawProfile) {
              setProfile(JSON.parse(rawProfile) as UserProfile);
            }
          });
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, [refreshSession]);

  // Timer proactivo: refresca 5 min antes de expirar
  useEffect(() => {
    if (!session) return;
    const decoded = jwtDecode<{ exp: number }>(session.access_token);
    const msUntilRefresh = decoded.exp * 1000 - Date.now() - REFRESH_MARGIN_MS;
    if (msUntilRefresh <= 0) {
      void refreshSession(session);
      return;
    }
    const t = setTimeout(() => void refreshSession(session), msUntilRefresh);
    return () => clearTimeout(t);
  }, [session, refreshSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await fetchFromAuth<{
      access_token: string;
      refresh_token: string;
      user: { id: string };
    }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

    const newSession: Session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      userId: data.user.id,
    };

    const profileData = await fetchFromAuth<UserProfile>("/auth/me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
    setSession(newSession);
    setProfile(profileData);
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    const data = await fetchFromAuth<{
      access_token: string;
      refresh_token: string;
      user: { id: string };
      profile: UserProfile;
    }>("/auth/signup", { method: "POST", body: JSON.stringify(payload) });

    const newSession: Session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      userId: data.user.id,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
    setSession(newSession);
    setProfile(data.profile);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
