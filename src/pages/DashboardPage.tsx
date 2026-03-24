// src/pages/DashboardPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowRight } from "lucide-react";
import { useAuth } from "hooks/useAuth";
import { usePartnerStats } from "hooks/useQuotes";
import { StatusPill } from "components/quotes/StatusPill";
import { PartnerQuote } from "types";

function StatCard({
  label, value, sub, tag, tagColor,
}: {
  label: string; value: string; sub: string; tag?: string; tagColor?: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="font-display font-semibold text-2xl text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
      {tag && (
        <span className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${tagColor}`}>
          {tag}
        </span>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { partner } = useAuth();
  const { quotes, loading, inProgress, completed, recent } = usePartnerStats();
  
  const navigate = useNavigate();

  // Compute total saved from nested project_info fields (values are in cents → convert to dollars)
  const totalSaved = quotes.reduce((acc: number, q: PartnerQuote) => {
    const list    = q.project_info?.projectDetails?.manualOverridePriceCents ?? 0;
    const partner = q.total_price_cents ?? 0;
    return acc + Math.max(0, (list - partner) / 100);
  }, 0);

  if (!partner) return null;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-xl text-gray-900">
            Welcome back, {partner.contact_name.split(" ")[0]}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{partner.company_name} · Sign Partner</p>
        </div>
        <button
          onClick={() => navigate("/quote/new")}
          className="inline-flex items-center gap-2 bg-nsd-purple text-white text-[13px] font-medium px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
        >
          + New quote request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="Total quotes"
          value={String(quotes.length)}
          sub="All time"
          tag="Sign Partner"
          tagColor="bg-purple-50 text-nsd-purple"
        />
        <StatCard
          label="In progress"
          value={String(inProgress.length)}
          sub="Active right now"
          tag={inProgress.length > 0 ? `${inProgress.length} need attention` : "All clear"}
          tagColor={inProgress.length > 0 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}
        />
        <StatCard
          label="Total saved"
          value={`$${totalSaved.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          sub="Partner discount applied"
          tag="15% off every order"
          tagColor="bg-green-50 text-green-600"
        />
        <StatCard
          label="Completed"
          value={String(completed.length)}
          sub="Orders shipped"
          tag="Avg. 3–4 weeks"
          tagColor="bg-gray-100 text-gray-500"
        />
      </div>

      {/* Recent quotes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-[14px] text-gray-900">Recent quotes</h3>
          <button
            onClick={() => navigate("/quotes")}
            className="flex items-center gap-1 text-[12px] text-nsd-purple hover:underline"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-gray-400">
            Loading quotes…
          </div>
        ) : recent.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
            <FileText size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">No quotes yet</p>
            <button
              onClick={() => navigate("/quote/new")}
              className="mt-3 text-[13px] text-nsd-purple hover:underline"
            >
              Submit your first quote request →
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Quote #", "Description", "Submitted", "Status", "Amount", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((q: PartnerQuote) => (
                  <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-display font-semibold text-[12px] text-nsd-purple">
                      {q.quote_number}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[220px] truncate">
                      {(q.project_info?.projectDetails?.neonMaterial ?? "").replace(/_/g, " ")}
                      {q.project_info?.customerInfo?.firstName
                        ? ` · ${q.project_info.customerInfo.firstName} ${q.project_info.customerInfo.lastName}`
                        : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-[11px]">
                      {new Date(q._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={q.quote_activity} />
                    </td>
                    <td className="px-4 py-3 font-display font-semibold text-gray-900">
                      {q.total_price_cents != null ? `$${(q.total_price_cents/100).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/quotes/${q._id}`)}
                        className="text-[11px] text-gray-400 hover:text-nsd-purple border border-gray-200 hover:border-nsd-purple/30 px-3 py-1 rounded-lg transition-all"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
