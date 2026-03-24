// src/pages/admin/AdminPartnersPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAdminPartners } from "hooks/useAdmin";
import { PartnerWithStats } from "types/admin";
import { cn } from "lib/utils";
import { Check, X } from "lucide-react";

export function AdminPartnersPage() {
  const { partners, loading } = useAdminPartners();
  const updatePartner = useMutation(api.partners.update);
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);

  async function toggleActive(p: PartnerWithStats) {
    await updatePartner({ id: p._id as any, is_active: !p.is_active });
    forceUpdate((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">{partners.length} partner accounts</p>
        <button onClick={() => navigate("/admin/partners/new")}
          className="bg-nsd-purple text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          + Add partner
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Company","Contact","Type","Program","Quotes","Completed","Spend","Last activity","Status",""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(partners as PartnerWithStats[]).map((p) => (
                <tr key={p._id} className={cn("hover:bg-gray-50 transition-colors", !p.is_active && "opacity-50")}>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.company_name}</td>
                  <td className="px-4 py-3 text-[12px]">
                    <div className="text-gray-700">{p.contact_name}</div>
                    <div className="text-gray-400">{p.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize text-[12px]">{p.partner_type.replace(/_/g," ")}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-nsd-purple">
                      Sign Partner
                    </span>
                  </td>
                  <td className="px-4 py-3 font-display font-semibold text-gray-900">{p.total_quotes}</td>
                  <td className="px-4 py-3 font-display font-semibold text-green-600">{p.completed_orders}</td>
                  <td className="px-4 py-3 font-display font-semibold text-gray-900 whitespace-nowrap">
                    ${p.total_spend.toLocaleString("en-US",{minimumFractionDigits:0})}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-[11px]">
                    {p.last_quote_at ? new Date(p.last_quote_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      p.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400")}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)}
                      className="p-1.5 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all">
                      {p.is_active ? <X size={13} /> : <Check size={13} />}
                    </button>
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
