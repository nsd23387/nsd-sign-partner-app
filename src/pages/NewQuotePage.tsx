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
import { FileDropzone } from "components/quotes/FileDropzone";
import { cn } from "lib/utils";
import { convex } from "lib/convex";

// ─── Zod schema ────────────────────────────────────────────────────────────
const schema = z.object({
  // Step 1
  signType:     z.enum(["logo_image", "text_only"]),
  neonMaterial: z.enum(["led_flex_neon", "led_flex_neon_uv", "channel_letter"]),
  signText:     z.string().optional(),

  // Step 2
  installation: z.enum(["indoors", "outdoors"]),
  backShape:    z.enum(["cut_to_shape", "cut_to_circle", "cut_to_square_rect", "cut_to_lettering"]),
  maxSize:      z.string().min(1, "Required"),
  width:        z.string().optional(),
  length:       z.string().optional(),

  // Step 3
  backColor:    z.string().min(1, "Required"),
  signColors:   z.string().min(1, "Describe the sign colors"),
  quantity:     z.coerce.number().int().min(1).default(1),

  // Step 4
  clientFirstName: z.string().optional(),
  clientLastName:  z.string().optional(),
  clientEmail:     z.string().email().optional().or(z.literal("")),
  clientPhone:     z.string().optional(),
  clientCompany:   z.string().optional(),
  additionalNotes: z.string().optional(),
  rushOrder:       z.boolean().optional(),
  rgbLighting:     z.boolean().optional(),
  waterproofing:   z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, label: "Sign type & design" },
  { id: 2, label: "Size & shape" },
  { id: 3, label: "Colors & finish" },
  { id: 4, label: "Client & notes" },
];

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  1: ["signType", "neonMaterial"],
  2: ["installation", "backShape", "maxSize"],
  3: ["backColor", "signColors", "quantity"],
  4: [],
};

// ─── Reusable field/radio helpers ──────────────────────────────────────────
function RadioGroup<T extends string>({
  options, value, onChange, cols = 2,
}: {
  options: { value: T; label: string; sub?: string }[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-2.5 rounded-lg border text-[13px] font-medium text-left transition-all",
            value === o.value
              ? "border-nsd-purple bg-purple-50 text-nsd-purple"
              : "border-gray-200 text-gray-600 hover:border-nsd-purple/40"
          )}
        >
          {o.label}
          {o.sub && <span className="block text-[11px] font-normal text-gray-400 mt-0.5">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

function Field({ label, error, children, required, hint }: {
  label: string; error?: string; children: React.ReactNode;
  required?: boolean; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-gray-600">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="ml-1.5 text-[11px] font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple";

// ─── Pricing helper — mirrors NSD pricing engine logic ─────────────────────
function estimatePrice(data: Partial<FormData>, discountPct: number): { list: number; partner: number } {
  // Simplified estimate shown to partner before NSD confirms final price.
  // NSD admin will override with actual price from the pricing engine.
  const sizeNum = parseFloat(data.maxSize ?? "24") || 24;
  const base    = 80 + sizeNum * 4.5;
  const matMult = data.neonMaterial === "channel_letter" ? 2.2
                : data.neonMaterial === "led_flex_neon_uv" ? 1.35 : 1;
  const qty     = data.quantity ?? 1;
  const list    = Math.round(base * matMult * qty);
  const partner = Math.round(list * (1 - discountPct / 100));
  return { list, partner };
}

// ─── Main component ────────────────────────────────────────────────────────
export function NewQuotePage() {
  const { partner } = useAuth();
  const navigate    = useNavigate();
  const [step, setStep]         = useState(1);
  const [files, setFiles]       = useState<{ file: File; preview?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitQuote  = useMutation(api.partnerQuotes.submitPartnerQuote);
  const addDesignFiles = useMutation(api.partnerQuotes.addDesignFiles);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors }, trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      signType: "logo_image", neonMaterial: "led_flex_neon",
      installation: "indoors", backShape: "cut_to_shape",
      backColor: "transparent", quantity: 1,
    },
  });

  const w = watch();
  const estimate = partner ? estimatePrice(w, partner.discount_pct) : { list: 0, partner: 0 };

  async function nextStep() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  }

  async function uploadDesignFiles(quoteId: string) {
    if (!files.length) return;
    // Use Convex file storage (same as nsd-custom-quotes)
    const uploaded: { name: string; url: string }[] = [];
    for (const { file } of files) {
      // Get upload URL from Convex storage
      const uploadUrl = await convex.mutation(api.quotes.generateUploadUrl as any, {});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      // Get public URL
      const url = await convex.query(api.quotes.getFileUrl as any, { storageId });
      if (url) uploaded.push({ name: file.name, url });
    }
    if (uploaded.length) {
      await addDesignFiles({ quote_id: quoteId as any, files: uploaded });
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!partner) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Build signColors array from the free-text description
      const signColorsArray = data.signColors
        .split(",").map((s) => s.trim()).filter(Boolean);

      const result = await submitQuote({
        partner_id:      partner._id as any,
        partner_company: partner.company_name,
        partner_tier:    partner.tier,
        discount_pct:    partner.discount_pct,

        projectDetails: {
          signType:      data.signType === "logo_image" ? "Logo/Image" : "Text Only",
          neonMaterial:  data.neonMaterial,
          installation:  data.installation,
          backColor:     data.backColor,
          backShape:     data.backShape,
          signColors:    signColorsArray,
          maxSize:       data.maxSize,
          width:         data.width,
          length:        data.length,
          fontChoice:    "default",
          signText:      data.signText ?? "",
          hasImage:      data.signType === "logo_image",
          quantity:      data.quantity ?? 1,
          useType:       data.installation,
          additionalNotes: data.additionalNotes,
          rgbLighting:   data.rgbLighting,
          rushOrder:     data.rushOrder,
          waterproofing: data.waterproofing,
        },

        clientInfo: {
          firstName:   data.clientFirstName || partner.contact_name.split(" ")[0],
          lastName:    data.clientLastName  || partner.contact_name.split(" ").slice(1).join(" ") || ".",
          email:       data.clientEmail    || partner.email,
          phone:       data.clientPhone    || "",
          companyName: data.clientCompany,
          street1:     "TBD",
          city:        "TBD",
          state:       "TBD",
          zip:         "00000",
          country:     "US",
        },

        list_price_cents:    estimate.list * 100,
        partner_price_cents: estimate.partner * 100,
      });

      // Upload files to Convex storage
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

      {/* Discount banner */}
      <div className="mb-5 flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
        <span className="text-nsd-purple">✦</span>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-nsd-purple">
            Your {partner.discount_pct}% partner discount will be applied automatically.
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Submitting as {partner.company_name} · Sign Partner
          </p>
        </div>
        {estimate.list > 0 && (
          <div className="text-right">
            <p className="text-[11px] text-gray-400">Estimated</p>
            <p className="font-display font-bold text-[15px] text-gray-900">${estimate.partner}</p>
            <p className="text-[10px] text-green-600">
              Save ${estimate.list - estimate.partner}
            </p>
          </div>
        )}
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
              <span className={cn(
                "text-[12px] font-medium hidden sm:block whitespace-nowrap",
                step === s.id ? "text-nsd-purple" : "text-gray-400"
              )}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-px mx-2", step > s.id ? "bg-nsd-purple" : "bg-gray-200")} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">

          {/* ── Step 1: Sign type & design ── */}
          {step === 1 && (<>
            <h3 className="font-display font-semibold text-[14px] text-gray-900">Sign type & design</h3>

            <Field label="What type of sign?" required error={errors.signType?.message}>
              <RadioGroup
                value={w.signType}
                onChange={(v) => setValue("signType", v)}
                options={[
                  { value: "logo_image", label: "Logo / Image", sub: "Upload a design file" },
                  { value: "text_only",  label: "Text only",    sub: "Type out the sign text" },
                ]}
              />
            </Field>

            {w.signType === "text_only" && (
              <Field label="Sign text" required>
                <input {...register("signText")} placeholder='e.g. "Open" or "Good Vibes Only"' className={INPUT} />
              </Field>
            )}

            <Field label="Neon material" required error={errors.neonMaterial?.message}>
              <RadioGroup
                value={w.neonMaterial}
                onChange={(v) => setValue("neonMaterial", v)}
                cols={3}
                options={[
                  { value: "led_flex_neon",    label: "LED Flex Neon",    sub: "Most popular" },
                  { value: "led_flex_neon_uv", label: "LED Flex + UV",    sub: "UV reactive" },
                  { value: "channel_letter",   label: "Channel Letter",   sub: "3D letters" },
                ]}
              />
            </Field>

            <Field label="Upload design file" hint="(optional — PDF, AI, PNG, JPG, SVG, EPS)">
              <FileDropzone files={files} onChange={setFiles} />
            </Field>
          </>)}

          {/* ── Step 2: Size & shape ── */}
          {step === 2 && (<>
            <h3 className="font-display font-semibold text-[14px] text-gray-900">Size & shape</h3>

            <Field label="Installation" required error={errors.installation?.message}>
              <RadioGroup
                value={w.installation}
                onChange={(v) => setValue("installation", v)}
                options={[
                  { value: "indoors",  label: "Indoors" },
                  { value: "outdoors", label: "Outdoors" },
                ]}
              />
            </Field>

            <Field label="Back shape" required error={errors.backShape?.message}>
              <RadioGroup
                value={w.backShape}
                onChange={(v) => setValue("backShape", v)}
                options={[
                  { value: "cut_to_shape",      label: "Cut-to-shape" },
                  { value: "cut_to_circle",      label: "Cut-to-circle" },
                  { value: "cut_to_square_rect", label: "Square / Rectangular" },
                  { value: "cut_to_lettering",   label: "Cut-to-lettering" },
                ]}
              />
            </Field>

            <Field label="Max size" required error={errors.maxSize?.message}
              hint="— longest dimension in inches">
              <RadioGroup
                value={w.maxSize ?? ""}
                onChange={(v) => setValue("maxSize", v)}
                cols={4}
                options={[
                  { value: "12",  label: '12"' },
                  { value: "18",  label: '18"' },
                  { value: "24",  label: '24"' },
                  { value: "36",  label: '36"' },
                  { value: "48",  label: '48"' },
                  { value: "60",  label: '60"' },
                  { value: "72",  label: '72"' },
                  { value: "custom", label: "Custom" },
                ]}
              />
            </Field>

            {w.maxSize === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label='Width (inches)'>
                  <input {...register("width")} placeholder='e.g. 38' className={INPUT} />
                </Field>
                <Field label='Height (inches)'>
                  <input {...register("length")} placeholder='e.g. 20' className={INPUT} />
                </Field>
              </div>
            )}
          </>)}

          {/* ── Step 3: Colors & finish ── */}
          {step === 3 && (<>
            <h3 className="font-display font-semibold text-[14px] text-gray-900">Colors & finish</h3>

            <Field label="Back color" required error={errors.backColor?.message}>
              <RadioGroup
                value={w.backColor ?? ""}
                onChange={(v) => setValue("backColor", v)}
                cols={3}
                options={[
                  { value: "transparent", label: "Transparent" },
                  { value: "black",       label: "Black" },
                  { value: "white",       label: "White" },
                  { value: "custom",      label: "Custom" },
                ]}
              />
            </Field>

            <Field label="Sign colors" required error={errors.signColors?.message}
              hint="— describe each color or Pantone code">
              <textarea
                {...register("signColors")}
                rows={2}
                placeholder="e.g. Purple (Pantone 266C), white outline — or: warm white"
                className={`${INPUT} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Quantity">
                <input {...register("quantity")} type="number" min={1} className={INPUT} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { name: "rgbLighting" as const, label: "RGB lighting" },
                { name: "rushOrder"   as const, label: "Rush order" },
                { name: "waterproofing" as const, label: "Waterproofing" },
              ].map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2.5 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-nsd-purple/40 transition-all">
                  <input {...register(name)} type="checkbox" className="accent-nsd-purple w-4 h-4" />
                  <span className="text-[13px] text-gray-600">{label}</span>
                </label>
              ))}
            </div>
          </>)}

          {/* ── Step 4: Client info & notes ── */}
          {step === 4 && (<>
            <h3 className="font-display font-semibold text-[14px] text-gray-900">Client & notes</h3>
            <p className="text-[12px] text-gray-400 -mt-3">
              End-client details are for your internal records only — NSD will white-label all communications.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Client first name">
                <input {...register("clientFirstName")} placeholder="Jane" className={INPUT} />
              </Field>
              <Field label="Client last name">
                <input {...register("clientLastName")} placeholder="Smith" className={INPUT} />
              </Field>
              <Field label="Client email">
                <input {...register("clientEmail")} type="email" placeholder="client@example.com" className={INPUT} />
              </Field>
              <Field label="Client phone">
                <input {...register("clientPhone")} placeholder="(555) 000-0000" className={INPUT} />
              </Field>
              <Field label="Client company" hint="(optional)">
                <input {...register("clientCompany")} placeholder="Salon Luxe" className={INPUT} />
              </Field>
            </div>

            <Field label="Additional notes">
              <textarea
                {...register("additionalNotes")}
                rows={4}
                placeholder="Power type (12V adapter / hardwired), mounting preference, special requirements, reference images…"
                className={`${INPUT} resize-none`}
              />
            </Field>

            {/* Estimated price summary */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[12px] text-gray-500 mb-1">Estimated quote total</p>
                <p className="font-display font-bold text-xl text-gray-900">
                  ${estimate.partner.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  List: ${estimate.list.toLocaleString()} · Saving ${(estimate.list - estimate.partner).toLocaleString()} ({partner.discount_pct}% off)
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400">NSD will confirm final price</p>
                <p className="text-[11px] text-gray-400">after mockup review</p>
              </div>
            </div>

            {submitError && (
              <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {submitError}
              </p>
            )}
          </>)}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-4">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 text-[13px] text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all">
              <ChevronLeft size={14} /> Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button type="button" onClick={nextStep}
              className="flex items-center gap-1.5 bg-nsd-purple text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Continue <ChevronRight size={14} />
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
