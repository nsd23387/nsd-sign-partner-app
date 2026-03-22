// src/pages/NewQuotePage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "hooks/useAuth";
import { supabase } from "lib/supabase";
import { submitQuoteToNSD } from "lib/nsdWebhook";
import { FileDropzone } from "components/quotes/FileDropzone";
import { cn } from "lib/utils";
import {
  SignType, Material, InstallationType, BackColor, BackShape,
} from "types";

// ─── Schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  sign_type:         z.enum(["logo_image", "text_only"]),
  material:          z.enum(["led_flex_neon", "led_flex_neon_uv", "channel_letter"]),
  installation_type: z.enum(["indoors", "outdoors"]),
  width_inches:      z.coerce.number().positive().optional(),
  height_inches:     z.coerce.number().positive().optional(),
  back_color:        z.enum(["transparent", "black", "other"]),
  back_color_other:  z.string().optional(),
  back_shape:        z.enum(["cut_to_shape", "cut_to_circle", "cut_to_square_rect", "cut_to_lettering"]),
  sign_colors:       z.string().min(1, "Please describe the sign colors"),
  quantity:          z.coerce.number().int().positive().default(1),
  additional_notes:  z.string().optional(),
  client_name:       z.string().optional(),
  client_email:      z.string().email().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

// ─── Step config ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Sign type & design" },
  { id: 2, label: "Specifications" },
  { id: 3, label: "Colors & details" },
  { id: 4, label: "Client info" },
];

// ─── Option helpers ────────────────────────────────────────────────────────
function RadioGroup<T extends string>({
  name, options, value, onChange, cols = 2,
}: {
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className={`grid gap-2 grid-cols-${cols}`}>
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
        </button>
      ))}
    </div>
  );
}

function Field({ label, error, children, required }: {
  label: string; error?: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-gray-600">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export function NewQuotePage() {
  const { partner } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<{ file: File; preview?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sign_type: "logo_image",
      material: "led_flex_neon",
      installation_type: "indoors",
      back_color: "transparent",
      back_shape: "cut_to_shape",
      quantity: 1,
    },
  });

  const watchAll = watch();

  const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
    1: ["sign_type", "material"],
    2: ["installation_type", "back_shape", "width_inches", "height_inches"],
    3: ["back_color", "sign_colors", "quantity"],
    4: ["client_name", "client_email", "additional_notes"],
  };

  async function nextStep() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  }

  async function uploadFiles(quoteId: string): Promise<string[]> {
    const urls: string[] = [];
    for (const { file } of files) {
      const path = `${partner!.id}/${quoteId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from("design-files").upload(path, file);
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from("design-files").getPublicUrl(data.path);
        urls.push(publicUrl);
      }
    }
    return urls;
  }

  const onSubmit = async (data: FormData) => {
    if (!partner) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Insert quote row in Supabase
      const { data: quoteRow, error: quoteErr } = await supabase
        .from("quotes")
        .insert({
          partner_id: partner.id,
          partner_tag: "sign_partner",
          ...data,
          discount_pct: partner.discount_pct,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (quoteErr || !quoteRow) throw new Error(quoteErr?.message ?? "Failed to create quote");

      // 2. Upload design files
      if (files.length > 0) {
        const urls = await uploadFiles(quoteRow.id);
        await supabase.from("design_files").insert(
          urls.map((url, i) => ({
            quote_id: quoteRow.id,
            file_name: files[i].file.name,
            file_url: url,
            file_type: files[i].file.type,
            size_bytes: files[i].file.size,
            uploaded_at: new Date().toISOString(),
          }))
        );
      }

      // 3. Fire NSD webhook → drops into existing quote management system
      await submitQuoteToNSD(
        { ...data, partner_id: partner.id, design_files: [], discount_pct: partner.discount_pct,
          quantity: data.quantity ?? 1, status: "submitted",
          submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        partner
      );

      navigate(`/quotes/${quoteRow.id}?submitted=true`);
    } catch (err: any) {
      setSubmitError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!partner) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Partner discount banner */}
      <div className="mb-5 flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
        <span className="text-nsd-purple text-base">✦</span>
        <div>
          <p className="text-[13px] font-medium text-nsd-purple">
            Your {partner.discount_pct}% partner discount will be applied automatically.
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Submitting as {partner.company_name} · Sign Partner
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all",
                step > s.id
                  ? "bg-green-500 text-white"
                  : step === s.id
                  ? "bg-nsd-purple text-white"
                  : "bg-gray-100 text-gray-400"
              )}>
                {step > s.id ? <CheckCircle size={14} /> : s.id}
              </div>
              <span className={cn(
                "text-[12px] font-medium hidden sm:block",
                step === s.id ? "text-nsd-purple" : "text-gray-400"
              )}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-px mx-3", step > s.id ? "bg-nsd-purple" : "bg-gray-200")} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <h3 className="font-display font-semibold text-[14px] text-gray-900">Sign type & design</h3>

              <Field label="Sign type" required error={errors.sign_type?.message}>
                <RadioGroup
                  name="sign_type"
                  value={watchAll.sign_type}
                  onChange={(v) => setValue("sign_type", v as SignType)}
                  options={[
                    { value: "logo_image", label: "Logo / Image" },
                    { value: "text_only",  label: "Text only" },
                  ]}
                />
              </Field>

              <Field label="Material" required error={errors.material?.message}>
                <RadioGroup
                  name="material"
                  value={watchAll.material}
                  onChange={(v) => setValue("material", v as Material)}
                  cols={3}
                  options={[
                    { value: "led_flex_neon",    label: "LED Flex Neon" },
                    { value: "led_flex_neon_uv", label: "LED Flex Neon + UV" },
                    { value: "channel_letter",   label: "Channel Letter" },
                  ]}
                />
              </Field>

              <Field label="Upload design file (optional)">
                <FileDropzone files={files} onChange={setFiles} />
              </Field>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <h3 className="font-display font-semibold text-[14px] text-gray-900">Specifications</h3>

              <Field label="Installation type" required error={errors.installation_type?.message}>
                <RadioGroup
                  name="installation_type"
                  value={watchAll.installation_type}
                  onChange={(v) => setValue("installation_type", v as InstallationType)}
                  options={[
                    { value: "indoors",  label: "Indoors" },
                    { value: "outdoors", label: "Outdoors" },
                  ]}
                />
              </Field>

              <Field label="Back shape" required error={errors.back_shape?.message}>
                <RadioGroup
                  name="back_shape"
                  value={watchAll.back_shape}
                  onChange={(v) => setValue("back_shape", v as BackShape)}
                  cols={2}
                  options={[
                    { value: "cut_to_shape",       label: "Cut-to-shape" },
                    { value: "cut_to_circle",       label: "Cut-to-circle" },
                    { value: "cut_to_square_rect",  label: "Cut-to-square / rectangular" },
                    { value: "cut_to_lettering",    label: "Cut-to-lettering" },
                  ]}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label='Width (inches)' error={errors.width_inches?.message}>
                  <input
                    {...register("width_inches")}
                    type="number"
                    placeholder='e.g. 38'
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple"
                  />
                </Field>
                <Field label='Height (inches)' error={errors.height_inches?.message}>
                  <input
                    {...register("height_inches")}
                    type="number"
                    placeholder='e.g. 20'
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple"
                  />
                </Field>
              </div>
            </>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <>
              <h3 className="font-display font-semibold text-[14px] text-gray-900">Colors & details</h3>

              <Field label="Back color" required error={errors.back_color?.message}>
                <RadioGroup
                  name="back_color"
                  value={watchAll.back_color}
                  onChange={(v) => setValue("back_color", v as BackColor)}
                  cols={3}
                  options={[
                    { value: "transparent", label: "Transparent" },
                    { value: "black",       label: "Black" },
                    { value: "other",       label: "Other" },
                  ]}
                />
                {watchAll.back_color === "other" && (
                  <input
                    {...register("back_color_other")}
                    placeholder="Describe color or Pantone code"
                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple"
                  />
                )}
              </Field>

              <Field label="Sign colors" required error={errors.sign_colors?.message}>
                <textarea
                  {...register("sign_colors")}
                  rows={2}
                  placeholder="e.g. Purple (Pantone 266C), white outline · or: warm white"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple resize-none"
                />
              </Field>

              <Field label="Quantity" required error={errors.quantity?.message}>
                <input
                  {...register("quantity")}
                  type="number"
                  min={1}
                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple"
                />
              </Field>
            </>
          )}

          {/* ── Step 4 ── */}
          {step === 4 && (
            <>
              <h3 className="font-display font-semibold text-[14px] text-gray-900">Client info & notes</h3>
              <p className="text-[12px] text-gray-400 -mt-3">
                For your internal records only — not shared with NSD clients. Your branding stays front and center.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Field label="End client name" error={errors.client_name?.message}>
                  <input
                    {...register("client_name")}
                    placeholder="e.g. Salon Luxe"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple"
                  />
                </Field>
                <Field label="End client email (optional)" error={errors.client_email?.message}>
                  <input
                    {...register("client_email")}
                    type="email"
                    placeholder="client@example.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple"
                  />
                </Field>
              </div>

              <Field label="Additional notes" error={errors.additional_notes?.message}>
                <textarea
                  {...register("additional_notes")}
                  rows={4}
                  placeholder="Power type (12V adapter / hardwired), mounting notes, rush order, special requirements…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple resize-none"
                />
              </Field>

              {submitError && (
                <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-lg transition-all"
            >
              <ChevronLeft size={14} /> Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-1.5 bg-nsd-purple text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (!partner) return;
                  await supabase.from("quotes").insert({
                    partner_id: partner.id, partner_tag: "sign_partner",
                    ...watch(), discount_pct: partner.discount_pct,
                    status: "draft",
                    submitted_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                  });
                  navigate("/quotes");
                }}
                className="text-[13px] text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all"
              >
                Save draft
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-nsd-purple text-white text-[13px] font-medium px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? "Submitting…" : "Submit quote request"}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
