// src/pages/QuoteDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, CheckCircle } from "lucide-react";
import { supabase } from "lib/supabase";
import { QuoteRequest } from "types";
import { StatusPill, STATUS_PROGRESS } from "components/quotes/StatusPill";
import { useAuth } from "hooks/useAuth";

const FIELD_LABELS: Partial<Record<keyof QuoteRequest, string>> = {
  sign_type:         "Sign type",
  material:          "Material",
  installation_type: "Installation",
  width_inches:      "Width",
  height_inches:     "Height",
  back_color:        "Back color",
  back_shape:        "Back shape",
  sign_colors:       "Sign colors",
  quantity:          "Quantity",
  additional_notes:  "Notes",
};

function fmt(key: keyof QuoteRequest, val: unknown): string {
  if (val == null || val === "") return "—";
  if (key === "width_inches" || key === "height_inches") return `${val}"`;
  return String(val).replace(/_/g, " ");
}

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { partner } = useAuth();
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const justSubmitted = params.get("submitted") === "true";

  useEffect(() => {
    if (!id) return;
    supabase
      .from("quotes")
      .select("*, design_files(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => { setQuote(data as QuoteRequest); setLoading(false); });
  }, [id]);

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading…</div>;
  if (!quote) return <div className="py-12 text-center text-sm text-gray-400">Quote not found.</div>;

  const progress = STATUS_PROGRESS[quote.status];
  const saved = quote.list_price && quote.partner_price ? quote.list_price - quote.partner_price : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Success banner */}
      {justSubmitted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-green-700">Quote submitted successfully!</p>
            <p className="text-[11px] text-green-600 mt-0.5">
              Our team will prepare your mockups and get back to you shortly.
            </p>
          </div>
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => navigate("/quotes")}
        className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft size={13} /> Back to quotes
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-display font-semibold text-nsd-purple text-[13px]">{quote.quote_number}</p>
            <h2 className="font-display font-semibold text-xl text-gray-900 mt-0.5">
              {quote.material.replace(/_/g, " ")}
              {quote.client_name ? ` · ${quote.client_name}` : ""}
            </h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Submitted {new Date(quote.submitted_at).toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
          </div>
          <StatusPill status={quote.status} />
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Submitted</span>
            <span>Mockup</span>
            <span>Review</span>
            <span>Approved</span>
            <span>Complete</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-nsd-purple rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      {quote.partner_price != null && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Pricing</p>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-[11px] text-gray-400">Partner price</p>
              <p className="font-display font-bold text-2xl text-gray-900">${quote.partner_price.toFixed(2)}</p>
            </div>
            {quote.list_price && (
              <div>
                <p className="text-[11px] text-gray-400">List price</p>
                <p className="font-display text-[15px] text-gray-400 line-through">${quote.list_price.toFixed(2)}</p>
              </div>
            )}
            {saved && (
              <div className="ml-auto bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-right">
                <p className="text-[10px] text-green-600 font-medium uppercase tracking-wider">You saved</p>
                <p className="font-display font-semibold text-green-600 text-lg">${saved.toFixed(2)}</p>
                <p className="text-[10px] text-green-500">{quote.discount_pct}% partner discount</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Specs */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Sign specifications</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {(Object.keys(FIELD_LABELS) as (keyof QuoteRequest)[]).map((key) => (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-[11px] text-gray-400">{FIELD_LABELS[key]}</dt>
              <dd className="text-[13px] font-medium text-gray-800 capitalize">{fmt(key, quote[key])}</dd>
            </div>
          ))}
        </dl>
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
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-nsd-purple transition-colors"
                >
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
