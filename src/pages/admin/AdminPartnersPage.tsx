// src/pages/admin/AdminPartnersPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminPartners, updatePartnerTier } from "hooks/useAdmin";
import { PartnerWithStats } from "types/admin";
import { cn } from "lib/utils";
import { supabase } from "lib/supabase";
import { Check, X, ChevronDown } from "lucide-react";

const TIER_STYLES: Record<string, string> = {
  silver:   "bg-gray-100 text-gray-600",
  gold:     "bg-amber-50 text-amber-600",
  platinum: "bg-cyan-50 text-cyan-700",
};

const TIER_OPTIONS = [
  { value: "silver",   label: "Silver (20%)" },
  { value: "gold",     label: "Gold (25%)" },
  { value: "platinum", label: "Platinum (30%)" },
];

const DISCOUNT_BY_TIER: Record<string, number> = { silver: 20, gold: 25, platinum: 30 };

function TierSelect({ partner, onUpdate }: { partner: PartnerWithStats; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function select(tier: string) {
    setSaving(true);
    setOpen(false);
    await updatePartnerTier(partner.id, tier as any, DISCOUNT_BY_TIER[tier]);
    await onUpdate();
    setSaving(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className={cn(
          "flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize transition-all",
          TIER_STYLES[partner.tier]
        )}
      >
        {saving ? "…" : partner.tier}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute z-10 top-full left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[150px]">
          {TIER_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => select(t.value)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {partner.tier === t.value && <Check size={11} className="text-nsd-purple" />}
              {partner.tier !== t.value && <span className="w-3" />}
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminPartnersPage() {
  const { partners, loading, refetch } = useAdminPartners();
  const navigate = useNavigate();

  async function toggleActive(p: PartnerWithStats) {
    await supabase.from("partners").update({ is_active: !p.is_active }).eq("id", p.id);
    await refetch();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">{partners.length} partner accounts</p>
        <button
          onClick={() => navigate("/admin/partners/new")}
          className="bg-nsd-purple text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          + Add partner
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Company", "Contact", "Type", "Tier", "Quotes", "Completed", "Total spend", "Last activity", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {partners.map((p) => (
                <tr key={p.id} className={cn("hover:bg-gray-50 transition-colors", !p.is_active && "opacity-50")}>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.company_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-[12px]">
                    <div>{p.contact_name}</div>
                    <div className="text-gray-400">{p.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize text-[12px]">
                    {p.partner_type.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3">
                    <TierSelect partner={p} onUpdate={refetch} />
                  </td>
                  <td className="px-4 py-3 font-display font-semibold text-gray-900">{p.total_quotes}</td>
                  <td className="px-4 py-3 font-display font-semibold text-green-600">{p.completed_orders}</td>
                  <td className="px-4 py-3 font-display font-semibold text-gray-900">
                    ${p.total_spend.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-[11px]">
                    {p.last_quote_at
                      ? new Date(p.last_quote_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", p.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400")}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(p)}
                        className="p-1.5 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all"
                        title={p.is_active ? "Deactivate" : "Activate"}
                      >
                        {p.is_active ? <X size={13} /> : <Check size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
