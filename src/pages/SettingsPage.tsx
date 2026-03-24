// src/pages/SettingsPage.tsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "hooks/useAuth";

export function SettingsPage() {
  const { partner } = useAuth();
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);
  const updatePartner = useMutation(api.partners.update);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      company_name: partner?.company_name  ?? "",
      contact_name: partner?.contact_name  ?? "",
      phone:        partner?.phone         ?? "",
      partner_type: partner?.partner_type  ?? "sign_shop",
    },
  });

  if (!partner) return null;

  const onSubmit = async (data: any) => {
    setSaving(true);
    await updatePartner({ id: partner._id as any, ...data });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Program & discount card */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-4">Partner program</p>
        <div className="flex items-start gap-5">
          <div className="bg-gradient-to-br from-nsd-purple to-purple-700 rounded-xl px-5 py-4 text-white min-w-[160px] flex-shrink-0">
            <p className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Program</p>
            <p className="font-display font-bold text-lg">NSD Sign Partner</p>
            <p className="text-[11px] opacity-80 mt-1">15% off eligible custom business signs</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 mb-2">Wholesale pricing tiers</p>
            <div className="space-y-1.5 text-[12px] text-gray-600">
              <div className="flex justify-between bg-gray-50 rounded px-3 py-1.5"><span>Tier 1: 25–50 units</span><span className="font-semibold">15% off</span></div>
              <div className="flex justify-between bg-gray-50 rounded px-3 py-1.5"><span>Tier 2: 51–100 units</span><span className="font-semibold">25% off</span></div>
              <div className="flex justify-between bg-gray-50 rounded px-3 py-1.5"><span>Tier 3: 101–500 units</span><span className="font-semibold">35% off</span></div>
              <div className="flex justify-between bg-gray-50 rounded px-3 py-1.5"><span>Tier 4: 500+ units</span><span className="font-semibold">45%+ off</span></div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Wholesale pricing applies automatically when you order 25+ units on any quote</p>
          </div>
        </div>
      </div>

      {/* Account form */}
      <form onSubmit={handleSubmit(onSubmit)}
        className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Account details</p>

        <div className="grid grid-cols-2 gap-4">
          {[
            { name: "company_name", label: "Company name" },
            { name: "contact_name", label: "Primary contact" },
            { name: "phone",        label: "Phone number" },
          ].map(({ name, label }) => (
            <div key={name} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-gray-500">{label}</label>
              <input {...register(name as any)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple" />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">Email</label>
            <input value={partner.email} disabled
              className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-[13px] text-gray-400" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-gray-500">Partner type</label>
          <div className="flex gap-4 flex-wrap">
            {[
              { value: "sign_shop",         label: "Sign shop / Agency" },
              { value: "event_company",     label: "Event company" },
              { value: "interior_designer", label: "Interior designer" },
              { value: "other",             label: "Other" },
            ].map((o) => (
              <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                <input {...register("partner_type")} type="radio" value={o.value} className="accent-nsd-purple" />
                <span className="text-[13px] text-gray-600">{o.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-nsd-purple text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors">
            {saving  && <Loader2 size={13} className="animate-spin" />}
            {saved   ? <><CheckCircle size={13} /> Saved</> : saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Contact NSD */}
      <div className="bg-nsd-navy rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="font-display font-semibold text-white text-[14px]">Need help?</p>
          <p className="text-[12px] text-white/50 mt-0.5">Reach your NSD partner rep directly</p>
        </div>
        <a href="mailto:orders@neonsignsdepot.com"
          className="text-[12px] font-medium text-nsd-glow border border-nsd-purple/40 px-4 py-2 rounded-lg hover:bg-nsd-purple/20 transition-colors">
          orders@neonsignsdepot.com
        </a>
      </div>
    </div>
  );
}
