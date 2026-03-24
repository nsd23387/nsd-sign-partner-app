// src/components/quotes/QuoteCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FileImage, Type, ExternalLink } from "lucide-react";
import { PartnerQuote, ACTIVITY_LABEL, ACTIVITY_COLOR, ACTIVITY_PROGRESS } from "types";
import { StatusPill } from "./StatusPill";

interface Props {
  quote: PartnerQuote;
}

const MATERIAL_LABEL: Record<string, string> = {
  led_flex_neon:    "LED Flex Neon",
  led_flex_neon_uv: "LED Flex Neon + UV",
  channel_letter:   "Channel Letter",
};

export function QuoteCard({ quote }: Props) {
  const navigate = useNavigate();

  // Derive display values from nested project_info structure
  const details  = quote.project_info?.projectDetails;
  const customer = quote.project_info?.customerInfo;
  const material   = details?.neonMaterial ?? "";
  const signType   = details?.signType ?? "";
  const width      = details?.width;
  const height     = details?.length;  // "length" maps to the height dimension in the schema
  const signColors = details?.signColors?.join(", ") ?? "";
  const submittedAt = quote._creationTime;

  // Partner price is total_price_cents; list price is manualOverridePriceCents
  const partnerPriceDollars = (quote.total_price_cents ?? 0) / 100;
  const listPriceDollars    = (details?.manualOverridePriceCents ?? 0) / 100;
  const saved = listPriceDollars > 0 && listPriceDollars > partnerPriceDollars
    ? listPriceDollars - partnerPriceDollars
    : null;

  // Suppress unused import warnings — these are used indirectly via StatusPill
  void ACTIVITY_LABEL; void ACTIVITY_COLOR; void ACTIVITY_PROGRESS;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:border-nsd-purple/30 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
        {signType === "logo_image"
          ? <FileImage size={18} className="text-nsd-purple" />
          : <Type size={18} className="text-nsd-purple" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display text-[12px] font-semibold text-nsd-purple">{quote.quote_number}</span>
          {customer?.companyName && (
            <span className="text-[11px] text-gray-400">· {customer.companyName}</span>
          )}
        </div>
        <p className="text-[13px] text-gray-700 font-medium truncate">
          {MATERIAL_LABEL[material] ?? material.replace(/_/g, " ")}
          {width && height ? ` · ${width}"×${height}"` : ""}
          {signColors ? ` · ${signColors}` : ""}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Submitted {new Date(submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        {quote.total_price_cents != null && (
          <p className="font-display font-semibold text-[15px] text-gray-900">
            ${partnerPriceDollars.toFixed(2)}
          </p>
        )}
        {saved != null && saved > 0 && (
          <p className="text-[11px] text-green-600 font-medium">−${saved.toFixed(2)} saved</p>
        )}
        <div className="mt-1.5">
          <StatusPill status={quote.quote_activity} showProgress />
        </div>
      </div>

      <button
        onClick={() => navigate(`/quotes/${quote._id}`)}
        className="ml-2 p-2 rounded-lg text-gray-300 hover:text-nsd-purple hover:bg-purple-50 transition-all"
      >
        <ExternalLink size={15} />
      </button>
    </div>
  );
}
