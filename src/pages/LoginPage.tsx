// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "hooks/useAuth";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) { setError(error); setLoading(false); }
    else navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-nsd-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-display font-bold text-2xl text-white">
            Neon<span className="text-nsd-glow">Signs</span>Depot
          </p>
          <p className="text-[13px] text-white/40 mt-1.5">Partner Portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 space-y-4 shadow-xl shadow-black/20"
        >
          <h1 className="font-display font-semibold text-[18px] text-gray-900">Sign in</h1>
          <p className="text-[12px] text-gray-400 -mt-2">Access your partner dashboard</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@yourcompany.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-nsd-purple"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-nsd-purple"
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-nsd-purple text-white text-[13px] font-semibold py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-[11px] text-gray-400 pt-1">
            Not a partner yet?{" "}
            <a href="https://neonsignsdepot.com/partners" className="text-nsd-purple hover:underline">
              Apply to join →
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
