// src/pages/admin/AdminOverviewPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdminStats, useAdminQuotes } from "hooks/useAdmin";
import { StatusPill } from "components/quotes/StatusPill";

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="font-display font-bold text-2xl text-gray-900">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      {accent && (
        <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
          {accent}
        </span>
      )}
    </div>
  );
}

export function AdminOverviewPage() {
  const { stats, loading: statsLoading } = useAdminStats();
  const { quotes: pending } = useAdminQuotes("submitted");
  const { quotes: mockupReview } = useAdminQuotes("mockup_review");
  const navigate = useNavigate();

  const needsAction = [...pending, ...mockupReview]
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        <Stat
          label="Active partners"
          value={statsLoading ? "—" : String(stats?.active_partners ?? 0)}
          sub={`${stats?.total_partners ?? 0} total`}
        />
        <Stat
          label="Quotes this month"
          value={statsLoading ? "—" : String(stats?.quotes_this_month ?? 0)}
          sub={`${stats?.total_quotes ?? 0} all time`}
        />
        <Stat
          label="Pending review"
          value={statsLoading ? "—" : String(stats?.quotes_pending_review ?? 0)}
          sub="Need attention"
          accent={stats?.quotes_pending_review ? `${stats.quotes_pending_review} open` : undefined}
        />
        <Stat
          label="Revenue (month)"
          value={statsLoading ? "—" : `$${(stats?.revenue_this_month ?? 0).toLocaleString()}`}
          sub={`$${(stats?.total_revenue ?? 0).toLocaleString()} all time`}
        />
      </div>

      {/* Action queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-[14px] text-gray-900">
            Needs action
            {needsAction.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {needsAction.length}
              </span>
            )}
          </h3>
          <button
            onClick={() => navigate("/admin/quotes")}
            className="text-[12px] text-nsd-purple hover:underline"
          >
            View all quotes →
          </button>
        </div>

        {needsAction.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-gray-400">
            All caught up — no quotes need action right now.
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Quote #", "Partner", "Description", "Submitted", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {needsAction.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-display font-semibold text-[12px] text-nsd-purple whitespace-nowrap">
                      {q.quote_number}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-[12px]">{q.partner_company}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                      {q.material.replace(/_/g, " ")}
                      {q.client_name ? ` · ${q.client_name}` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-[11px] whitespace-nowrap">
                      {new Date(q.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={q.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/quotes/${q.id}`)}
                        className="text-[11px] text-gray-400 hover:text-nsd-purple border border-gray-200 hover:border-nsd-purple/30 px-3 py-1 rounded-lg transition-all"
                      >
                        Review
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
