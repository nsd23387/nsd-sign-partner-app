// src/pages/QuoteDetailPage.tsx
import React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ArrowLeft, Download, FileText, CheckCircle, ExternalLink } from "lucide-react";
import { ACTIVITY_LABEL, ACTIVITY_PROGRESS, ACTIVITY_COLOR } from "types";
import { cn } from "lib/utils";

const CUSTOMER_PORTAL = "https://customer.neonsignsdepot.com/quote";

const SPEC_DISPLAY = [
  { key: "signType",     label: "Sign type" },
  { key: "neonMaterial", label: "Material" },
  { key: "installation", label: "Installation" },
  { key: "maxSize",      label: "Max size" },
  { key: "backColor",    label: "Back color" },
  { key: "backShape",    label: "Back shape" },
  { key: "quantity",     label: "Quantity" },
];

export function QuoteDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const justSubmitted = params.get("submitted") === "true";

  const quote = useQuery(
    api.quotes.getByIdPublic as any,
    id ? { id } : "skip"
  ) as any;

  if (quote === undefined) return (
    <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
  );
  if (!quote) return (
    <div className="py-12 text-center text-sm text-gray-400">Quote not found.</div>
  );

  const details   = quote.project_info?.projectDetails ?? {};
  const activity  = quote.quote_activity ?? "Quote Submitted";
  const progress  = ACTIVITY_PROGRESS[activity] ?? 10;
  const label     = ACTIVITY_LABEL[activity] ?? activity;
  const colorCls  = ACTIVITY_COLOR[activity] ?? "bg-gray-50 text-gray-500";

  const listCents    = details.manualOverridePriceCents ?? 0;
  const partnerCents = quote.total_price_cents ?? 0;
  const savedCents   = Math.max(0, listCents - partnerCents);
  const isPriced     = partnerCents > 0;

  const mockups = (quote.admin_images ?? []).filter((f: any) => f.isMockup);
  const customerUrl = quote.public_token
    ? `${CUSTOMER_PORTAL}/${quote.public_token}`
    : null;

  // Show "View full quote" button once pricing is set or mockups are ready
  const showCustomerLink = customerUrl && [
    "Mockups In Review", "Awaiting Response", "Design Approved",
    "Quote Approved", "Awaiting Deposit", "Deposit Paid",
    "Quote Paid", "Delivered",
  ].includes(activity);

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Success banner */}
      {justSubmitted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-green-700">Quote submitted successfully!</p>
            <p className="text-[11px] text-green-600 mt-0.5">
              Our team will prepare your mockups and confirm pricing shortly.
            </p>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/quotes")}
        className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
        <ArrowLeft size={13} /> Back to quotes
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-display font-semibold text-nsd-purple text-[13px]">{quote.quote_number}</p>
            <h2 className="font-display font-semibold text-xl text-gray-900 mt-0.5">
              {details.neonMaterial?.replace(/_/g, " ") ?? "Neon sign"}
              {quote.project_info?.customerInfo?.companyName
                ? ` · ${quote.project_info.customerInfo.companyName}`
                : ""}
            </h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Submitted {new Date(quote._creationTime).toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
          </div>
          <span className={cn("text-[11px] font-semibold px-3 py-1 rounded-full", colorCls)}>
            {label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Submitted</span><span>Mockup</span><span>Approved</span>
            <span>Production</span><span>Delivered</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-nsd-purple rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* View full quote CTA — shown once NSD has priced and sent mockups */}
      {showCustomerLink && (
        <a href={customerUrl!} target="_blank" rel="noreferrer"
          className="flex items-center justify-between bg-nsd-navy text-white rounded-xl px-5 py-4 hover:bg-opacity-90 transition-all group">
          <div>
            <p className="font-display font-semibold text-[15px]">View full quote & mockups</p>
            <p className="text-[12px] text-white/60 mt-0.5">
              Review designs, approve mockups, and pay deposit
            </p>
          </div>
          <ExternalLink size={18} className="text-white/60 group-hover:text-white transition-colors flex-shrink-0" />
        </a>
      )}

      {/* Pricing — shown once NSD sets it */}
      {isPriced && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Pricing</p>
          <div className="flex items-end gap-6 flex-wrap">
            <div>
              <p className="text-[11px] text-gray-400">Your partner price</p>
              <p className="font-display font-bold text-2xl text-gray-900">
                ${(partnerCents / 100).toFixed(2)}
              </p>
            </div>
            {listCents > 0 && (
              <div>
                <p className="text-[11px] text-gray-400">List price</p>
                <p className="font-display text-[15px] text-gray-400 line-through">
                  ${(listCents / 100).toFixed(2)}
                </p>
              </div>
            )}
            {savedCents > 0 && (
              <div className="ml-auto bg-green-50 border border-green-100 rounded-lg px-4 py-2 text-right">
                <p className="text-[10px] text-green-600 font-medium uppercase tracking-wider">You saved</p>
                <p className="font-display font-semibold text-green-600 text-lg">
                  ${(savedCents / 100).toFixed(2)}
                </p>
                <p className="text-[10px] text-green-500">Partner discount</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mockup thumbnails — quick preview */}
      {mockups.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Mockups</p>
            {customerUrl && (
              <a href={customerUrl} target="_blank" rel="noreferrer"
                className="text-[11px] text-nsd-purple hover:underline flex items-center gap-1">
                Review & approve <ExternalLink size={10} />
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {mockups.map((m: any) => (
              <div key={m.fileId} className="relative group">
                <img src={m.url} alt={m.name}
                  className="w-full h-40 object-cover rounded-lg border border-gray-100" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-lg">
                  <a href={customerUrl ?? m.url} target="_blank" rel="noreferrer"
                    className="bg-white text-nsd-navy text-[11px] font-semibold px-3 py-1.5 rounded-lg">
                    View full quote
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending pricing notice */}
      {!isPriced && !justSubmitted && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <p className="text-[13px] font-medium text-amber-700">Pricing pending</p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            Our team will review your specs and confirm partner pricing shortly.
            You'll see the full quote link here once mockups are ready.
          </p>
        </div>
      )}

      {/* Specs */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Sign specifications</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {SPEC_DISPLAY.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-[11px] text-gray-400">{label}</dt>
              <dd className="text-[13px] font-medium text-gray-800 capitalize">
                {details[key] != null && details[key] !== ""
                  ? String(details[key]).replace(/_/g, " ")
                  : "—"}
              </dd>
            </div>
          ))}
          {details.signColors?.length > 0 && (
            <div className="flex flex-col gap-0.5 col-span-2">
              <dt className="text-[11px] text-gray-400">Sign colors</dt>
              <dd className="text-[13px] font-medium text-gray-800">
                {details.signColors.join(", ")}
              </dd>
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

      {/* Uploaded design files */}
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
