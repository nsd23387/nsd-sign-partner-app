// src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from "react";
import { convex } from "lib/convex";
import { Partner } from "types";

interface AuthState {
  partner: Partner | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const SESSION_KEY = "nsd_partner_session";

export const AuthContext = createContext<AuthState>({
  partner: null,
  loading: true,
  signIn: async () => ({}),
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthState {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try { setPartner(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    try {
      // signIn is a mutation (not an action) — it needs direct db access
      const result = await convex.mutation("partners:signIn" as any, { email, password }) as any;
      if (!result.success) return { error: result.error };
      setPartner(result.partner);
      localStorage.setItem(SESSION_KEY, JSON.stringify(result.partner));
      return {};
    } catch (err: any) {
      return { error: err.message ?? "Sign in failed" };
    }
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
    setPartner(null);
  }

  return { partner, loading, signIn, signOut };
}
