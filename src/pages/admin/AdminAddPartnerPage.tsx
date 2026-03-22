// src/pages/admin/AdminAddPartnerPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "lib/supabase";

const schema = z.object({
  company_name:  z.string().min(1, "Required"),
  contact_name:  z.string().min(1, "Required"),
  email:         z.string().email("Valid email required"),
  phone:         z.string().optional(),
  partner_type:  z.enum(["sign_shop", "event_company", "interior_designer", "agency", "other"]),
  tier:          z.enum(["silver", "gold", "platinum"]),
  portal_slug:   z.string().min(1, "Required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  temp_password: z.string().min(8, "Minimum 8 characters"),
});

type FormData = z.infer<typeof schema>;

const DISCOUNT_BY_TIER: Record<string, number> = { silver: 20, gold: 25, platinum: 30 };

export function AdminAddPartnerPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { partner_type: "sign_shop", tier: "silver" },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError(null);

    // 1. Create Supabase auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.temp_password,
      email_confirm: true,
    });

    if (authErr || !authData.user) {
      setError(authErr?.message ?? "Failed to create auth user");
      setSaving(false);
      return;
    }

    // 2. Insert partner row
    const { error: partnerErr } = await supabase.from("partners").insert({
      auth_user_id:  authData.user.id,
      company_name:  data.company_name,
      contact_name:  data.contact_name,
      email:         data.email,
      phone:         data.phone || null,
      partner_type:  data.partner_type,
      tier:          data.tier,
      discount_pct:  DISCOUNT_BY_TIER[data.tier],
      portal_slug:   data.portal_slug,
      is_active:     true,
    });

    if (partnerErr) {
      setError(partnerErr.message);
      setSaving(false);
      return;
    }

    navigate("/admin/partners");
  };

  function Field({ name, label, required, children }: {
    name: keyof FormData; label: string; required?: boolean; children: React.ReactNode;
  }) {
    const err = errors[name]?.message;
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-gray-500">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
        {err && <p className="text-[11px] text-red-500">{err}</p>}
      </div>
    );
  }

  const tierVal = watch("tier");

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button onClick={() => navigate("/admin/partners")} className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600">
        <ArrowLeft size={13} /> Back to partners
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <h2 className="font-display font-semibold text-[16px] text-gray-900">Add new partner</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field name="company_name" label="Company name" required>
            <input {...register("company_name")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple" />
          </Field>
          <Field name="contact_name" label="Primary contact" required>
            <input {...register("contact_name")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple" />
          </Field>
          <Field name="email" label="Email address" required>
            <input {...register("email")} type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple" />
          </Field>
          <Field name="phone" label="Phone number">
            <input {...register("phone")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple" />
          </Field>
          <Field name="portal_slug" label="Portal slug" required>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-nsd-purple">
              <span className="px-2.5 py-2 bg-gray-50 text-[11px] text-gray-400 border-r border-gray-200 whitespace-nowrap">partners.nsd.com/</span>
              <input {...register("portal_slug")} placeholder="company-name" className="flex-1 px-3 py-2 text-[13px] focus:outline-none" />
            </div>
          </Field>
          <Field name="temp_password" label="Temporary password" required>
            <input {...register("temp_password")} type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple" />
          </Field>
        </div>

        <Field name="partner_type" label="Partner type" required>
          <select {...register("partner_type")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple">
            <option value="sign_shop">Sign shop / Agency</option>
            <option value="event_company">Event company</option>
            <option value="interior_designer">Interior designer</option>
            <option value="agency">Creative agency</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <Field name="tier" label="Starting tier" required>
          <div className="grid grid-cols-3 gap-2">
            {(["silver", "gold", "platinum"] as const).map((t) => (
              <label key={t} className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all ${tierVal === t ? "border-nsd-purple bg-purple-50" : "border-gray-200 hover:border-nsd-purple/40"}`}>
                <input {...register("tier")} type="radio" value={t} className="sr-only" />
                <span className="text-[13px] font-semibold capitalize text-gray-800">{t}</span>
                <span className="text-[11px] text-gray-400">{DISCOUNT_BY_TIER[t]}% off</span>
              </label>
            ))}
          </div>
        </Field>

        {error && (
          <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={() => navigate("/admin/partners")} className="text-[13px] text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-nsd-purple text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60">
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? "Creating…" : "Create partner account"}
          </button>
        </div>
      </form>
    </div>
  );
}
