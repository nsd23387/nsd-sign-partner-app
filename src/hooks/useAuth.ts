// src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "lib/supabase";
import { Partner } from "types";

interface AuthState {
  partner: Partner | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  partner: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthState {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchPartner(session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchPartner(session.user.id);
      else { setPartner(null); setLoading(false); }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchPartner(userId: string) {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("auth_user_id", userId)
      .single();

    if (!error && data) setPartner(data as Partner);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }

  async function signOut() {
    await supabase.auth.signOut();
    setPartner(null);
  }

  return { partner, loading, signIn, signOut };
}
