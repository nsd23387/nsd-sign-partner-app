// src/components/auth/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { partner, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-nsd-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-gray-400">Loading your portal…</p>
        </div>
      </div>
    );
  }
  if (!partner) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
