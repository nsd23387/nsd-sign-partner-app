// src/pages/admin/AdminQuoteDetailPage.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft, Download, FileText, Loader2, CheckCircle } from "lucide-react";
import { ACTIVITY_LABEL, ACTIVITY_COLOR } from "types";
import { cn } from "lib/utils";

// Status transitions matching NSD's existing quote_activity flow
const TRANSITIONS: Record<string, { next: string; label: string; color: string }[]> = {
  new:             [{ next: "pricing",    label: "Mark as pricing",       color: "bg-purple-600 text-white" }],
  pricing:         [{ next: "mockup",     label: "Send to designer",      color: "bg-nsd-purple text-white" }],
  mockup:          [{ next: "revision",   label: "Send for revision",     color: "bg-amber-500 text-white" },
                    { next: "approved",   label: "Approve mockups",       color: "bg-green-600 text-white" }],
  revision:        [{ next: "mockup",     label: "Mockups updated",       color: "bg-nsd-purple text-white" }],
  approved:        [{ next: "payment_pending", label: "Request payment",  color: "bg-teal-600 text-white" }],
  payment_pending: [{ next: "paid",       label: "Mark as paid",          color: "bg-green-600 text-white" }],
  paid:            [{ next: "production", label: "Send to production",    color: "bg-indigo-600 text-white" }],
  production:      [{ next: "shipped",    label: "Mark as shipped",       color: "bg-cyan-600 text-white" }],
  shipped:         [{ next: "delivered",  label: "Mark as delivered",     color: "bg-green-600 text-white" }],
  delivered: [], cancelled: [],
};

const SPEC_LABELS = [
  { key: "signType",      label: "Sign type" },
  { key: "neonMaterial",  label: "Material" },
  { key: "installation",  label: "Installation" },
  { key: "maxSize",       label: "Max size" },
  { key: "backColor",     label: "Back color" },
  { key: "backShape",     label: "Back shape" },
  { key: "quantity",      label: "Quantity" },
];

export function AdminQuoteDetailPage() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const [listPrice, setListPrice]         = useState("");
  const [partnerPrice, setPartnerPrice]   = useState("");
  const [saving, setSaving]               = useState(false);
  const [priceSaved, setPriceSaved]       = useState(false);

  // Reactive — updates in real-time via Convex websocket
  const quote = useQuery(api.quotes.getByIdPublic as any, id ? { id } : "skip") as any;

  // Use your existing quotes mutation to update status + price
  const updateQuote = useMutation(api.quotes.updateQuoteActivity as any);
  const updatePrice = useMutation(api.quotes.updatePartnerPrice as any);

  if (quote === undefined) return <div className="py-12 text-center text-sm text-gray-400">Loading…</div>;
  if (!quote) return <div className="py-12 text-center text-sm text-gray-400">Quote not found.</div>;

  const details      = quote.project_info?.projectDetails ?? {};
  const activity     = quote.quote_activity ?? "new";
  const partnerName  = quote.campaign_info?.campaign_name ?? "—";
  const transitions  = TRANSITIONS[activity] ?? [];

  // Initialise price inputs from quote data
  const displayListPrice    = listPrice    || ((quote.project_info?.projectDetails?.manualOverridePriceCents ?? 0) / 100).toFixed(2);
  const displayPartnerPrice = partnerPrice || ((quote.total_price_cents ?? 0) / 100).toFixed(2);

  function handleListChange(val: string) {
    setListPrice(val);
    const n = parseFloat(val);
    // Auto-compute partner price from partner's discount
    if (!isNaN(n)) {
      // Get discount from campaign_info or default 15%
      const disc = 15; // TODO: look up partner discount from partner record
      setPartnerPrice((n * (1 - disc / 100)).toFixed(2));
    }
  }

  async function savePrice() {
    setSaving(true);
    await updatePrice({
      id: quote._id,
      list_price_cents:    Math.round(parseFloat(displayListPrice) * 100) || 0,
      partner_price_cents: Math.round(parseFloat(displayPartnerPrice) * 100) || 0,
    });
    setSaving(false); setPriceSaved(true);
    setTimeout(() => setPriceSaved(false), 2500);
  }

  async function advance(next: string) {
    setSaving(true);
    await updateQuote({ id: quote._id, activity: next });
    setSaving(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate("/admin/quotes")}
        className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
        <ArrowLeft size={13} /> Back to all quotes
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-start justify-between">
        <div>
          <p className="font-display font-semibold text-nsd-purple text-[13px]">{quote.quote_number}</p>
          <h2 className="font-display font-semibold text-xl text-gray-900 mt-0.5">
            {details.neonMaterial?.replace(/_/g," ") ?? "Neon sign"}
          </h2>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {partnerName} · sign partner ·{" "}
            {new Date(quote._creationTime).toLocaleDateString("en-US", { dateStyle: "long" })}
          </p>
          {quote.project_info?.customerInfo?.companyName && (
            <p className="text-[12px] text-gray-400 mt-0.5">
              End client: {quote.project_info.customerInfo.companyName}
            </p>
          )}
        </div>
        <span className={cn("text-[11px] font-semibold px-3 py-1 rounded-full", ACTIVITY_COLOR[activity] ?? "bg-gray-100 text-gray-500")}>
          {ACTIVITY_LABEL[activity] ?? activity}
        </span>
      </div>

      {/* Status actions */}
      {transitions.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Advance status</p>
          <div className="flex gap-2 flex-wrap">
            {transitions.map((t) => (
              <button key={t.next} onClick={() => advance(t.next)} disabled={saving}
                className={cn("flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60", t.color)}>
                {saving && <Loader2 size={13} className="animate-spin" />}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Pricing</p>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">List price ($)</label>
            <input value={displayListPrice} onChange={(e) => handleListChange(e.target.value)}
              placeholder="0.00"
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-display font-semibold focus:outline-none focus:border-nsd-purple" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">Partner price ($)</label>
            <input value={displayPartnerPrice} onChange={(e) => setPartnerPrice(e.target.value)}
              placeholder="0.00"
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-display font-semibold text-green-600 focus:outline-none focus:border-nsd-purple" />
          </div>
          <button onClick={savePrice} disabled={saving}
            className="flex items-center gap-1.5 bg-nsd-purple text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors mb-0.5">
            {priceSaved ? <><CheckCircle size={13} /> Saved</> : saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Save pricing"}
          </button>
        </div>
      </div>

      {/* Specs */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Sign specifications</p>
        <dl className="grid grid-cols-3 gap-x-6 gap-y-3">
          {SPEC_LABELS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-[11px] text-gray-400">{label}</dt>
              <dd className="text-[13px] font-medium text-gray-800 capitalize">
                {details[key] != null && details[key] !== "" ? String(details[key]).replace(/_/g," ") : "—"}
              </dd>
            </div>
          ))}
          {details.signColors?.length > 0 && (
            <div className="flex flex-col gap-0.5 col-span-3">
              <dt className="text-[11px] text-gray-400">Sign colors</dt>
              <dd className="text-[13px] font-medium text-gray-800">{details.signColors.join(", ")}</dd>
            </div>
          )}
        </dl>
        {details.additionalNotes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 mb-1">Notes</p>
            <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{details.additionalNotes}</p>
          </div>
        )}
      </div>

      {/* Design files */}
      {quote.quote_design?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Design files</p>
          <ul className="space-y-2">
            {quote.quote_design.map((f: any, i: number) => (
              <li key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <FileText size={15} className="text-gray-400 flex-shrink-0" />
                <span className="text-[12px] text-gray-700 flex-1 truncate">{f.name}</span>
                <a href={f.url} target="_blank" rel="noreferrer"
                  className="text-gray-400 hover:text-nsd-purple transition-colors">
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
