// src/components/auth/AdminRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";

// NSD staff emails — or use a role field in your partners/users table
const ADMIN_EMAILS = [
  "admin@neonsignsdepot.com",
  "orders@neonsignsdepot.com",
];

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { partner, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-nsd-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-nsd-glow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Allow if email matches NSD staff list
  // In production, replace with a `role` column check on your users table
  const isAdmin = partner && ADMIN_EMAILS.includes(partner.email);
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
