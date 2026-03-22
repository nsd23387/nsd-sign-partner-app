// src/components/layout/AdminShell.tsx
import React from "react";
import { Outlet, useLocation, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Settings, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "hooks/useAuth";
import { cn } from "lib/utils";

const NAV = [
  { to: "/admin",                label: "Overview",       icon: LayoutDashboard, exact: true },
  { to: "/admin/quotes",         label: "All quotes",     icon: FileText },
  { to: "/admin/partners",       label: "Partners",       icon: Users },
  { to: "/admin/settings",       label: "Settings",       icon: Settings },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin":          "Admin overview",
  "/admin/quotes":   "All partner quotes",
  "/admin/partners": "Partner accounts",
  "/admin/settings": "Admin settings",
};

export function AdminShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "Admin";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-nsd-navy flex flex-col min-h-screen flex-shrink-0">
        <div className="px-4 py-5 border-b border-white/10">
          <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-1">NSD Internal</p>
          <p className="font-display font-semibold text-white text-base">
            Neon<span className="text-nsd-glow">Signs</span>Depot
          </p>
        </div>

        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center gap-2">
          <ShieldCheck size={13} className="text-amber-400 flex-shrink-0" />
          <span className="text-[11px] font-medium text-amber-400">Admin portal</span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all",
                  isActive
                    ? "bg-nsd-purple/35 text-white font-medium"
                    : "text-white/60 hover:bg-white/7 hover:text-white"
                )
              }
            >
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-white/40 hover:text-white hover:bg-white/7 transition-all"
          >
            <Users size={13} /> Switch to partner view
          </NavLink>
          <button
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-[12px] text-white/40 hover:text-white hover:bg-white/7 transition-all"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6">
          <h1 className="font-display font-semibold text-nsd-navy text-[15px] flex-1">{title}</h1>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
