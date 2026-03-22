// src/pages/admin/AdminQuoteDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "lib/supabase";
import { updateQuoteStatus } from "hooks/useAdmin";
import { AdminQuoteRow } from "types/admin";
import { QuoteStatus } from "types";
import { StatusPill } from "components/quotes/StatusPill";
import { cn } from "lib/utils";

const STATUS_TRANSITIONS: Record<QuoteStatus, { next: QuoteStatus; label: string; color: string }[]> = {
  submitted:         [{ next: "awaiting_mockup",   label: "Send to designer",    color: "bg-nsd-purple text-white" }],
  awaiting_mockup:   [{ next: "mockup_review",     label: "Mockups uploaded",    color: "bg-nsd-purple text-white" }],
  mockup_review:     [{ next: "management_review", label: "Send to mgmt review", color: "bg-nsd-purple text-white" }],
  management_review: [
    { next: "approved",   label: "Approve & send to client", color: "bg-green-600 text-white" },
    { next: "mockup_review", label: "Request revision",       color: "bg-amber-500 text-white" },
  ],
  approved:          [{ next: "sent_to_client",    label: "Mark sent to client", color: "bg-teal-600 text-white" }],
  sent_to_client:    [{ next: "completed",         label: "Mark completed",      color: "bg-green-600 text-white" }],
  draft: [], completed: [], cancelled: [],
};

const SPEC_LABELS: { key: keyof AdminQuoteRow; label: string }[] = [
  { key: "sign_type",         label: "Sign type" },
  { key: "material",          label: "Material" },
  { key: "installation_type", label: "Installation" },
  { key: "width_inches",      label: "Width" },
  { key: "height_inches",     label: "Height" },
  { key: "back_color",        label: "Back color" },
  { key: "back_shape",        label: "Back shape" },
  { key: "sign_colors",       label: "Sign colors" },
  { key: "quantity",          label: "Qty" },
];

export function AdminQuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<AdminQuoteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [listPrice, setListPrice] = useState("");
  const [partnerPrice, setPartnerPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("quotes")
      .select("*, design_files(*), partners(company_name, tier, discount_pct)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          const row: AdminQuoteRow = {
            ...data,
            partner_company: (data as any).partners?.company_name ?? "—",
            partner_tier: (data as any).partners?.tier ?? "silver",
            partner_discount_pct: (data as any).partners?.discount_pct ?? 20,
          };
          setQuote(row);
          if (row.list_price) setListPrice(String(row.list_price));
          if (row.partner_price) setPartnerPrice(String(row.partner_price));
        }
        setLoading(false);
      });
  }, [id]);

  // Auto-compute partner price from list price + discount
  function handleListPriceChange(val: string) {
    setListPrice(val);
    const n = parseFloat(val);
    if (!isNaN(n) && quote) {
      setPartnerPrice((n * (1 - quote.partner_discount_pct / 100)).toFixed(2));
    }
  }

  async function savePrice() {
    if (!quote) return;
    setSaving(true);
    await supabase.from("quotes").update({
      list_price: parseFloat(listPrice) || null,
      partner_price: parseFloat(partnerPrice) || null,
      updated_at: new Date().toISOString(),
    }).eq("id", quote.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function advanceStatus(next: QuoteStatus) {
    if (!quote) return;
    setSaving(true);
    await updateQuoteStatus(quote.id, next);
    setQuote((q) => q ? { ...q, status: next } : q);
    setSaving(false);
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading…</div>;
  if (!quote) return <div className="py-12 text-center text-sm text-gray-400">Quote not found.</div>;

  const transitions = STATUS_TRANSITIONS[quote.status] ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => navigate("/admin/quotes")}
        className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft size={13} /> Back to all quotes
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-start justify-between">
        <div>
          <p className="font-display font-semibold text-nsd-purple text-[13px]">{quote.quote_number}</p>
          <h2 className="font-display font-semibold text-xl text-gray-900 mt-0.5">
            {quote.material.replace(/_/g, " ")}
          </h2>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {quote.partner_company} · {quote.partner_tier} partner ·{" "}
            {new Date(quote.submitted_at).toLocaleDateString("en-US", { dateStyle: "long" })}
          </p>
          {quote.client_name && (
            <p className="text-[12px] text-gray-400 mt-0.5">End client: {quote.client_name}</p>
          )}
        </div>
        <StatusPill status={quote.status} />
      </div>

      {/* Status actions */}
      {transitions.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Advance status</p>
          <div className="flex gap-2 flex-wrap">
            {transitions.map((t) => (
              <button
                key={t.next}
                onClick={() => advanceStatus(t.next)}
                disabled={saving}
                className={cn("flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60", t.color)}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">
          Pricing ({quote.partner_discount_pct}% partner discount auto-applied)
        </p>
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">List price ($)</label>
            <input
              value={listPrice}
              onChange={(e) => handleListPriceChange(e.target.value)}
              placeholder="0.00"
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-display font-semibold focus:outline-none focus:border-nsd-purple"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">Partner price ($)</label>
            <input
              value={partnerPrice}
              onChange={(e) => setPartnerPrice(e.target.value)}
              placeholder="0.00"
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-display font-semibold text-green-600 focus:outline-none focus:border-nsd-purple"
            />
          </div>
          <button
            onClick={savePrice}
            disabled={saving}
            className="flex items-center gap-1.5 bg-nsd-purple text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors mb-0.5"
          >
            {saved ? <><CheckCircle size={13} /> Saved</> : saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Save pricing"}
          </button>
        </div>
      </div>

      {/* Specs */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Sign specifications</p>
        <dl className="grid grid-cols-3 gap-x-6 gap-y-3">
          {SPEC_LABELS.map(({ key, label }) => (
            <div key={String(key)} className="flex flex-col gap-0.5">
              <dt className="text-[11px] text-gray-400">{label}</dt>
              <dd className="text-[13px] font-medium text-gray-800 capitalize">
                {quote[key] != null && quote[key] !== ""
                  ? String(quote[key]).replace(/_/g, " ") + (key === "width_inches" || key === "height_inches" ? '"' : "")
                  : "—"}
              </dd>
            </div>
          ))}
        </dl>
        {quote.additional_notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 mb-1">Additional notes</p>
            <p className="text-[13px] text-gray-700">{quote.additional_notes}</p>
          </div>
        )}
      </div>

      {/* Design files */}
      {quote.design_files?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Design files</p>
          <ul className="space-y-2">
            {quote.design_files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <FileText size={15} className="text-gray-400 flex-shrink-0" />
                <span className="text-[12px] text-gray-700 flex-1 truncate">{f.file_name}</span>
                <span className="text-[11px] text-gray-400">{(f.size_bytes / 1024 / 1024).toFixed(1)} MB</span>
                <a href={f.file_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-nsd-purple transition-colors">
                  <Download size={14} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
