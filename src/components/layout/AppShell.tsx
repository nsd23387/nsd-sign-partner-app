// src/components/layout/AppShell.tsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "hooks/useAuth";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/quote/new": "New quote request",
  "/quotes": "My quotes & orders",
  "/settings": "Account settings",
};

export function AppShell() {
  const { partner } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "Partner Portal";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0">
          <h1 className="font-display font-semibold text-nsd-navy text-[15px] flex-1">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{partner?.contact_name}</span>
            <a
              href="/quote/new"
              className="inline-flex items-center gap-1.5 bg-nsd-purple text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              + New quote
            </a>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
