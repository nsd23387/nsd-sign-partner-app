// src/pages/NewQuotePage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { CheckCircle, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "hooks/useAuth";
import { WHOLESALE_TIERS } from "types/index";
import { FileDropzone } from "components/quotes/FileDropzone";
import { cn } from "lib/utils";
import { convex } from "lib/convex";

// ─── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  // Step 1 — Project
  signType:        z.enum(["Logo/Image", "Text Only"]),
  useType:         z.string().min(1, "Required"),
  hasImage:        z.boolean(),
  estimatedBudget: z.string().optional(),
  signText:        z.string().optional(),
  industry:        z.string().optional(),
  clientCompany:   z.string().optional(),

  // Step 2 — Specs
  installation:          z.string().min(1, "Required"),
  knowMeasurements:      z.boolean().default(false),
  maxSize:               z.string().min(1, "Required"),
  width:                 z.string().optional(),
  length:                z.string().optional(),
  neonMaterial:          z.string().min(1, "Required"),
  backColor:             z.string().min(1, "Required"),
  backShape:             z.string().min(1, "Required"),
  signColors:            z.array(z.string()).min(1, "Select at least one color"),
  multiColorDescription: z.string().optional(),
  fontChoice:            z.string().optional(),
  isCustomFont:          z.boolean().default(false),
  quantity:              z.coerce.number().int().min(1).default(1),
  rushOrder:             z.boolean().default(false),
  rgbLighting:           z.boolean().default(false),
  additionalNotes:       z.string().optional(),

  // Step 3 — End client (white-labelled)
  isForClient:     z.boolean().default(false),
  clientName:      z.string().optional(),
  clientNotes:     z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, label: "Project" },
  { id: 2, label: "Specs" },
  { id: 3, label: "Client" },
];

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  1: ["signType", "useType", "hasImage"],
  2: ["installation", "maxSize", "neonMaterial", "backColor", "backShape", "signColors"],
  3: [],
};

const USE_TYPES = ["Business", "Personal", "Event", "Restaurant", "Retail", "Healthcare", "Hospitality", "Other"];
const BUDGETS   = ["Under $500", "$500–$1,000", "$1,000–$2,000", "$2,000–$3,000", "$3,000+"];
const SIZES     = ['12"', '18"', '24"', '30"', '36"', '48"', '60"', '72"', "Custom"];
const FONTS     = ["Default", "Arial", "Script", "Block", "Cursive", "Serif", "Sans-Serif", "Custom"];

const MATERIALS = [
  { value: "LED Flex Neon",    sub: "Most popular" },
  { value: "LED Flex Neon UV", sub: "UV reactive" },
  { value: "Channel Letter",   sub: "3D letters" },
];

const BACK_COLORS = [
  { value: "Transparent", color: "bg-gray-100 border-2 border-dashed border-gray-300" },
  { value: "Black",       color: "bg-gray-900" },
  { value: "White",       color: "bg-white border border-gray-200" },
  { value: "Custom",      color: "bg-gradient-to-br from-purple-400 to-pink-400" },
];

const BACK_SHAPES = [
  { value: "Cut to Shape",       icon: "✦" },
  { value: "Cut to Circle",      icon: "●" },
  { value: "Cut to Rectangle",   icon: "▬" },
  { value: "Cut to Lettering",   icon: "A" },
];

const SIGN_COLORS = [
  { label: "White",  bg: "bg-white border border-gray-200",  text: "text-gray-700" },
  { label: "Red",    bg: "bg-red-500",   text: "text-white" },
  { label: "Blue",   bg: "bg-blue-500",  text: "text-white" },
  { label: "Green",  bg: "bg-green-500", text: "text-white" },
  { label: "Yellow", bg: "bg-yellow-400",text: "text-gray-800" },
  { label: "Orange", bg: "bg-orange-500",text: "text-white" },
  { label: "Purple", bg: "bg-purple-500",text: "text-white" },
  { label: "Pink",   bg: "bg-pink-500",  text: "text-white" },
  { label: "Teal",   bg: "bg-teal-500",  text: "text-white" },
];

// ─── Reusable helpers ──────────────────────────────────────────────────────────
const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-nsd-purple bg-white";

function Field({ label, error, children, required, hint }: {
  label: string; error?: string; children: React.ReactNode;
  required?: boolean; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-gray-600">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="ml-1.5 font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[true, false].map((v) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={cn("py-2.5 rounded-lg border text-[13px] font-medium transition-all",
            value === v
              ? "bg-nsd-purple text-white border-nsd-purple"
              : "border-gray-200 text-gray-600 hover:border-nsd-purple/40")}>
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function NewQuotePage() {
  const { partner }   = useAuth();
  const navigate      = useNavigate();
  const [step, setStep]         = useState(1);
  const [files, setFiles]       = useState<{ file: File; preview?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wholesaleUnlocked, setWholesaleUnlocked] = useState(false);

  const submitQuote    = useMutation(api.partnerQuotes.submitPartnerQuote);
  const addDesignFiles = useMutation(api.partnerQuotes.addDesignFiles);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors }, trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      signType: "Logo/Image", hasImage: true,
      useType: "Business", installation: "Indoors (no waterproof)",
      neonMaterial: "LED Flex Neon", backColor: "Transparent",
      backShape: "Cut to Shape", signColors: [],
      quantity: 1, rushOrder: false, rgbLighting: false,
      knowMeasurements: false, isForClient: false, isCustomFont: false,
    },
  });

  const w = watch();

  async function nextStep() {
    const valid = await trigger(STEP_FIELDS[step] as any);
    if (valid) setStep((s) => Math.min(s + 1, 3));
  }

  function toggleColor(color: string) {
    const current = w.signColors ?? [];
    if (current.includes(color)) {
      setValue("signColors", current.filter((c) => c !== color));
    } else {
      setValue("signColors", [...current, color]);
    }
  }

  async function uploadDesignFiles(quoteId: string) {
    if (!files.length) return;
    const uploaded: { name: string; url: string }[] = [];
    for (const { file } of files) {
      try {
        const uploadUrl = await convex.mutation(api.quoteUploads?.generateUploadUrl as any ?? "quoteUploads:generateUploadUrl" as any, {});
        const res = await fetch(uploadUrl, {
          method: "POST", headers: { "Content-Type": file.type }, body: file,
        });
        const { storageId } = await res.json();
        const url = await convex.query(api.quoteUploads?.getFileUrl as any ?? "quoteUploads:getFileUrl" as any, { storageId });
        if (url) uploaded.push({ name: file.name, url });
      } catch (e) { console.warn("File upload failed:", e); }
    }
    if (uploaded.length) await addDesignFiles({ quote_id: quoteId as any, files: uploaded });
  }

  const onSubmit = async (data: FormData) => {
    if (!partner) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitQuote({
        partner_id:      partner._id as any,
        partner_company: partner.company_name,
        partner_tier:    "partner",
        discount_pct:    partner.discount_pct,
        projectDetails: {
          signType:              data.signType,
          neonMaterial:          data.neonMaterial,
          installation:          data.installation,
          backColor:             data.backColor,
          backShape:             data.backShape,
          signColors:            data.signColors,
          maxSize:               data.maxSize,
          width:                 data.width,
          length:                data.length,
          fontChoice:            data.fontChoice || "Default",
          signText:              data.signText || "",
          hasImage:              data.hasImage,
          quantity:              data.quantity ?? 1,
          useType:               data.useType,
          additionalNotes:       [
            data.additionalNotes,
            data.clientNotes,
            data.multiColorDescription ? `Colors: ${data.multiColorDescription}` : null,
            data.estimatedBudget ? `Budget: ${data.estimatedBudget}` : null,
            data.industry ? `Industry: ${data.industry}` : null,
          ].filter(Boolean).join("\n"),
          rgbLighting:           data.rgbLighting,
          rushOrder:             data.rushOrder,
          multiColorDescription: data.multiColorDescription,
        },
        clientInfo: {
          firstName:   partner.contact_name.split(" ")[0],
          lastName:    partner.contact_name.split(" ").slice(1).join(" ") || ".",
          email:       partner.email,
          phone:       "",
          companyName: data.isForClient ? data.clientName : partner.company_name,
          street1: "TBD", city: "TBD", state: "TBD", zip: "00000", country: "US",
        },
        list_price_cents:    0,
        partner_price_cents: 0,
      });
      await uploadDesignFiles(result.quoteId);
      navigate(`/quotes/${result.quoteId}?submitted=true`);
    } catch (err: any) {
      setSubmitError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!partner) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Partner banner */}
      <div className="mb-5 flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
        <span className="text-nsd-purple">✦</span>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-nsd-purple">
            15% off eligible custom business signs as an approved NSD Sign Partner. Orders of 25+ units automatically qualify for wholesale pricing up to 45% off.
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{partner.company_name} · NSD Sign Partner</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all flex-shrink-0",
                step > s.id ? "bg-green-500 text-white"
                  : step === s.id ? "bg-nsd-purple text-white"
                  : "bg-gray-100 text-gray-400"
              )}>
                {step > s.id ? <CheckCircle size={14} /> : s.id}
              </div>
              <span className={cn("text-[12px] font-medium hidden sm:block",
                step === s.id ? "text-nsd-purple" : "text-gray-400")}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-px mx-3", step > s.id ? "bg-nsd-purple" : "bg-gray-200")} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">

          {/* ── Step 1: Project ── */}
          {step === 1 && (<>
            <div>
              <h3 className="font-display font-semibold text-[15px] text-gray-900">Project</h3>
              <p className="text-[12px] text-nsd-purple mt-0.5">Tell us about your project.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="What kind of sign are you looking for?" required error={errors.signType?.message}>
                <select {...register("signType")} className={INPUT}>
                  <option value="Logo/Image">Logo / Image</option>
                  <option value="Text Only">Text Only</option>
                </select>
              </Field>

              <Field label="What will you use this sign for?" required error={errors.useType?.message}>
                <select {...register("useType")} className={INPUT}>
                  {USE_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
            </div>

            {w.useType === "Business" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Company Name" hint="(optional)">
                  <input {...register("clientCompany")} placeholder="e.g. Salon Luxe" className={INPUT} />
                </Field>
                <Field label="What industry is your business in?">
                  <input {...register("industry")} placeholder="e.g. Restaurant, Retail..." className={INPUT} />
                </Field>
              </div>
            )}

            {w.signType === "Text Only" && (
              <Field label="Sign text">
                <input {...register("signText")} placeholder='e.g. "Good Vibes Only"' className={INPUT} />
              </Field>
            )}

            <Field label="Will you be providing an image of your logo or design?" required>
              <YesNo value={w.hasImage} onChange={(v) => setValue("hasImage", v)} />
            </Field>

            {w.hasImage && (
              <Field label="Upload Design Files" hint="PNG, JPG, PDF, AI, SVG, EPS · Max 50MB">
                <FileDropzone files={files} onChange={setFiles} />
              </Field>
            )}

            <Field label="Estimated Budget" hint="(optional)">
              <select {...register("estimatedBudget")} className={INPUT}>
                <option value="">Select estimated budget...</option>
                {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          </>)}

          {/* ── Step 2: Specs ── */}
          {step === 2 && (<>
            <div>
              <h3 className="font-display font-semibold text-[15px] text-gray-900">Specs</h3>
              <p className="text-[12px] text-nsd-purple mt-0.5">Customize your neon sign details.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Installation Type" required error={errors.installation?.message}>
                <select {...register("installation")} className={INPUT}>
                  <option value="Indoors (no waterproof)">Indoors (no waterproof)</option>
                  <option value="Outdoors (waterproof)">Outdoors (waterproof)</option>
                </select>
              </Field>

              <Field label="Maximum Size" required error={errors.maxSize?.message}>
                <select {...register("maxSize")} className={INPUT}>
                  <option value="">Select maximum size...</option>
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Have your measurements?">
              <div className="flex items-center gap-3">
                <YesNo value={w.knowMeasurements} onChange={(v) => setValue("knowMeasurements", v)} />
              </div>
            </Field>

            {w.knowMeasurements && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Height (inches)">
                  <input {...register("length")} placeholder="e.g. 20" className={INPUT} />
                </Field>
                <Field label="Width (inches)">
                  <input {...register("width")} placeholder="e.g. 38" className={INPUT} />
                </Field>
              </div>
            )}

            <Field label="Neon Material" required error={errors.neonMaterial?.message}>
              <div className="grid grid-cols-3 gap-2">
                {MATERIALS.map((m) => (
                  <button key={m.value} type="button"
                    onClick={() => setValue("neonMaterial", m.value)}
                    className={cn("p-3 rounded-lg border text-left transition-all",
                      w.neonMaterial === m.value
                        ? "border-nsd-purple bg-purple-50"
                        : "border-gray-200 hover:border-nsd-purple/40")}>
                    <p className="text-[13px] font-medium text-gray-800">{m.value}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{m.sub}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Back Color" required error={errors.backColor?.message}>
              <div className="grid grid-cols-4 gap-2">
                {BACK_COLORS.map((c) => (
                  <button key={c.value} type="button"
                    onClick={() => setValue("backColor", c.value)}
                    className={cn("flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                      w.backColor === c.value ? "border-nsd-purple bg-purple-50" : "border-gray-200 hover:border-nsd-purple/40")}>
                    <div className={cn("w-8 h-8 rounded-full", c.color)} />
                    <span className="text-[11px] text-gray-600">{c.value}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Back Shape" required error={errors.backShape?.message}>
              <div className="grid grid-cols-4 gap-2">
                {BACK_SHAPES.map((s) => (
                  <button key={s.value} type="button"
                    onClick={() => setValue("backShape", s.value)}
                    className={cn("flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                      w.backShape === s.value ? "border-nsd-purple bg-purple-50" : "border-gray-200 hover:border-nsd-purple/40")}>
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-[11px] text-gray-600 text-center leading-tight">{s.value}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Sign Colors (select all that apply)" required error={(errors.signColors as any)?.message}>
              <div className="flex flex-wrap gap-2">
                {SIGN_COLORS.map((c) => (
                  <button key={c.label} type="button"
                    onClick={() => toggleColor(c.label)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[12px] font-medium transition-all",
                      c.bg, c.text,
                      w.signColors?.includes(c.label)
                        ? "ring-2 ring-nsd-purple ring-offset-1 scale-105"
                        : "opacity-70 hover:opacity-100"
                    )}>
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>

            {w.signColors?.length > 1 && (
              <Field label="Multi-Color Description" hint="— describe arrangement or Pantone codes">
                <textarea {...register("multiColorDescription")} rows={2}
                  placeholder="e.g. Purple main text, white outline, pink background glow"
                  className={`${INPUT} resize-none`} />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Font of Choice">
                <select {...register("fontChoice")} className={INPUT}>
                  {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Quantity">
                <input {...register("quantity")} type="number" min={1} className={INPUT}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (val >= 25 && !wholesaleUnlocked) setWholesaleUnlocked(true);
                    register("quantity").onChange(e);
                  }}
                />
                {(() => {
                  const qty = w.quantity ?? 1;
                  const tier = WHOLESALE_TIERS.find((t) => qty >= t.min && (t.max === null || qty <= t.max));
                  if (tier) {
                    return (
                      <div className="space-y-1">
                        {wholesaleUnlocked && qty >= 25 && qty <= 50 && <p className="text-[11px] font-medium text-green-600 bg-green-50 border border-green-200 rounded px-2 py-1">Wholesale pricing unlocked!</p>}
                        <p className="text-[11px] font-medium text-green-600">{tier.label} · {tier.discount}%{tier.max === null ? "+" : ""} off</p>
                      </div>
                    );
                  }
                  return <p className="text-[11px] font-medium text-purple-600">15% partner discount applied</p>;
                })()}
              </Field>
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-medium text-gray-600">Add-ons</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "rushOrder" as const,  label: "Rush Order", sub: "+$100 · 7–10 business days" },
                  { name: "rgbLighting" as const, label: "RGB Lighting", sub: "+$100 · remote control" },
                ].map(({ name, label, sub }) => (
                  <label key={name}
                    className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      w[name] ? "border-nsd-purple bg-purple-50" : "border-gray-200 hover:border-nsd-purple/40")}>
                    <input {...register(name)} type="checkbox" className="accent-nsd-purple mt-0.5" />
                    <div>
                      <p className="text-[13px] font-medium text-gray-800">{label}</p>
                      <p className="text-[11px] text-gray-400">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Field label="Additional Notes" hint="(optional)">
              <textarea {...register("additionalNotes")} rows={3}
                placeholder="Power type, mounting preference, special requirements..."
                className={`${INPUT} resize-none`} />
            </Field>
          </>)}

          {/* ── Step 3: End Client ── */}
          {step === 3 && (<>
            <div>
              <h3 className="font-display font-semibold text-[15px] text-gray-900">Client</h3>
              <p className="text-[12px] text-nsd-purple mt-0.5">Internal records only — not shared with NSD clients.</p>
            </div>

            {/* Submitting partner's own info is pre-filled */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Submitting as</p>
              <p className="text-[13px] font-medium text-gray-900">{partner.contact_name}</p>
              <p className="text-[12px] text-gray-400">{partner.company_name} · {partner.email}</p>
            </div>

            <Field label="Is this for one of your clients?">
              <YesNo value={w.isForClient} onChange={(v) => setValue("isForClient", v)} />
            </Field>

            {w.isForClient && (
              <Field label="Client name / company">
                <input {...register("clientName")}
                  placeholder="e.g. Salon Luxe or Jane Smith"
                  className={INPUT} />
              </Field>
            )}

            <Field label="Notes for NSD" hint="(optional)">
              <textarea {...register("clientNotes")} rows={3}
                placeholder="Any additional context for our team — project background, client preferences, deadline..."
                className={`${INPUT} resize-none`} />
            </Field>

            {submitError && (
              <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {submitError}
              </p>
            )}
          </>)}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 text-[13px] text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all">
              <ChevronLeft size={14} /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button type="button" onClick={nextStep}
              className="flex items-center gap-1.5 bg-nsd-purple text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 bg-nsd-purple text-white text-[13px] font-medium px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Submitting…" : "Submit quote request →"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
