// src/pages/SettingsPage.tsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "hooks/useAuth";
import { supabase } from "lib/supabase";

const TIER_CONFIG = {
  silver:   { label: "Silver Partner", discount: 20, nextTier: "Gold",     nextOrders: 14, currentOrders: 9,  color: "from-gray-400 to-gray-500" },
  gold:     { label: "Gold Partner",   discount: 25, nextTier: "Platinum", nextOrders: 30, currentOrders: 14, color: "from-amber-400 to-yellow-500" },
  platinum: { label: "Platinum Partner", discount: 30, nextTier: null,     nextOrders: 0,  currentOrders: 30, color: "from-cyan-400 to-blue-500" },
};

export function SettingsPage() {
  const { partner } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      company_name:  partner?.company_name  ?? "",
      contact_name:  partner?.contact_name  ?? "",
      email:         partner?.email         ?? "",
      phone:         partner?.phone         ?? "",
      partner_type:  partner?.partner_type  ?? "sign_shop",
    },
  });

  if (!partner) return null;

  const tier = TIER_CONFIG[partner.tier];

  const onSubmit = async (data: any) => {
    setSaving(true);
    await supabase.from("partners").update(data).eq("id", partner.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Partner tier card */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-4">Partner tier</p>
        <div className="flex items-start gap-5">
          <div className={`bg-gradient-to-br ${tier.color} rounded-xl px-5 py-4 text-white min-w-[160px]`}>
            <p className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Current tier</p>
            <p className="font-display font-bold text-lg">{tier.label}</p>
            <p className="text-[11px] opacity-80 mt-1">{tier.discount}% off all orders</p>
          </div>
          {tier.nextTier && (
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-gray-800 mb-1">
                Next: {tier.nextTier} Partner
              </p>
              <p className="text-[12px] text-gray-400 mb-3">
                Place {tier.nextOrders - tier.currentOrders} more orders to unlock {tier.discount + 5}% discount + priority support
              </p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-nsd-purple rounded-full transition-all"
                  style={{ width: `${Math.round((tier.currentOrders / tier.nextOrders) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {tier.currentOrders} of {tier.nextOrders} orders toward {tier.nextTier}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Account form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Account details</p>

        <div className="grid grid-cols-2 gap-4">
          {[
            { name: "company_name", label: "Company name" },
            { name: "contact_name", label: "Primary contact" },
            { name: "email",        label: "Email address" },
            { name: "phone",        label: "Phone number" },
          ].map(({ name, label }) => (
            <div key={name} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-gray-500">{label}</label>
              <input
                {...register(name as any)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-gray-500">Partner type</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "sign_shop",          label: "Sign shop / Agency" },
              { value: "event_company",      label: "Event company" },
              { value: "interior_designer",  label: "Interior designer" },
              { value: "other",              label: "Other" },
            ].map((o) => (
              <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register("partner_type")}
                  type="radio"
                  value={o.value}
                  className="accent-nsd-purple"
                />
                <span className="text-[13px] text-gray-600">{o.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-nsd-purple text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saved ? <><CheckCircle size={13} /> Saved</> : saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Contact NSD */}
      <div className="bg-nsd-navy rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="font-display font-semibold text-white text-[14px]">Need help?</p>
          <p className="text-[12px] text-white/50 mt-0.5">Reach your NSD partner rep directly</p>
        </div>
        <a
          href="mailto:orders@neonsignsdepot.com"
          className="text-[12px] font-medium text-nsd-glow border border-nsd-purple/40 px-4 py-2 rounded-lg hover:bg-nsd-purple/20 transition-colors"
        >
          orders@neonsignsdepot.com
        </a>
      </div>
    </div>
  );
}
