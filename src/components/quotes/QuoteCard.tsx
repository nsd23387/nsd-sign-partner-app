// src/components/quotes/QuoteCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FileImage, Type, ExternalLink } from "lucide-react";
import { QuoteRequest } from "types";
import { StatusPill } from "./StatusPill";

interface Props {
  quote: QuoteRequest;
}

const MATERIAL_LABEL: Record<string, string> = {
  led_flex_neon:    "LED Flex Neon",
  led_flex_neon_uv: "LED Flex Neon + UV",
  channel_letter:   "Channel Letter",
};

export function QuoteCard({ quote }: Props) {
  const navigate = useNavigate();
  const saved = quote.list_price && quote.partner_price
    ? quote.list_price - quote.partner_price
    : null;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:border-nsd-purple/30 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
        {quote.sign_type === "logo_image"
          ? <FileImage size={18} className="text-nsd-purple" />
          : <Type size={18} className="text-nsd-purple" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display text-[12px] font-semibold text-nsd-purple">{quote.quote_number}</span>
          {quote.client_name && (
            <span className="text-[11px] text-gray-400">· {quote.client_name}</span>
          )}
        </div>
        <p className="text-[13px] text-gray-700 font-medium truncate">
          {MATERIAL_LABEL[quote.material]}
          {quote.width_inches && quote.height_inches
            ? ` · ${quote.width_inches}"×${quote.height_inches}"`
            : ""}
          {quote.sign_colors ? ` · ${quote.sign_colors}` : ""}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Submitted {new Date(quote.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        {quote.partner_price != null && (
          <p className="font-display font-semibold text-[15px] text-gray-900">
            ${quote.partner_price.toFixed(2)}
          </p>
        )}
        {saved != null && saved > 0 && (
          <p className="text-[11px] text-green-600 font-medium">−${saved.toFixed(2)} saved</p>
        )}
        <div className="mt-1.5">
          <StatusPill status={quote.status} showProgress />
        </div>
      </div>

      <button
        onClick={() => navigate(`/quotes/${quote.id}`)}
        className="ml-2 p-2 rounded-lg text-gray-300 hover:text-nsd-purple hover:bg-purple-50 transition-all"
      >
        <ExternalLink size={15} />
      </button>
    </div>
  );
}
