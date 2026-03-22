// src/components/layout/Sidebar.tsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, FileText, Settings, LogOut } from "lucide-react";
import { useAuth } from "hooks/useAuth";
import { cn } from "lib/utils";

const NAV = [
  { to: "/dashboard",  label: "Dashboard",           icon: LayoutDashboard },
  { to: "/quote/new",  label: "New quote request",    icon: PlusCircle },
  { to: "/quotes",     label: "My quotes & orders",   icon: FileText },
  { to: "/settings",   label: "Settings",             icon: Settings },
];

const TIER_COLORS: Record<string, string> = {
  silver:   "text-gray-300",
  gold:     "text-amber-400",
  platinum: "text-cyan-300",
};

export function Sidebar() {
  const { partner, signOut } = useAuth();
  const navigate = useNavigate();

  if (!partner) return null;

  return (
    <aside className="w-56 bg-nsd-navy flex flex-col min-h-screen flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-1">Powered by</p>
        <p className="font-display font-semibold text-white text-base">
          Neon<span className="text-nsd-glow">Signs</span>Depot
        </p>
      </div>

      {/* Partner badge */}
      <div className="mx-3 mt-3 p-3 rounded-lg bg-nsd-purple/20 border border-nsd-purple/35">
        <p className="text-white text-xs font-medium truncate">{partner.company_name}</p>
        <p className="text-nsd-glow text-[10px] font-medium uppercase tracking-wider mt-0.5">
          ✦ Sign Partner
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest px-2 pb-1">Menu</p>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
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

      {/* Discount + tier */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="p-3 rounded-lg bg-gradient-to-br from-nsd-purple/30 to-nsd-glow/20 border border-nsd-purple/30">
          <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Partner discount</p>
          <p className={cn("font-display font-semibold text-xl text-nsd-glow")}>
            {partner.discount_pct}% off
          </p>
          <p className="text-[11px] text-white/40 mt-0.5">Applied to all orders</p>
        </div>
        <button
          onClick={async () => { await signOut(); navigate("/login"); }}
          className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-[12px] text-white/40 hover:text-white hover:bg-white/7 transition-all"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
