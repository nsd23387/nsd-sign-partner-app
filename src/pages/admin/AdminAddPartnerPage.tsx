// src/pages/admin/AdminAddPartnerPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2, ArrowLeft } from "lucide-react";

const schema = z.object({
  company_name:  z.string().min(1, "Required"),
  contact_name:  z.string().min(1, "Required"),
  email:         z.string().email("Valid email required"),
  phone:         z.string().optional(),
  partner_type:  z.enum(["sign_shop","event_company","interior_designer","agency","other"]),
  portal_slug:   z.string().min(1, "Required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers, hyphens only"),
  // Password stored as plain text for now — swap for bcrypt hash in production
  auth_token:    z.string().min(8, "Minimum 8 characters"),
});

type FormData = z.infer<typeof schema>;
const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-nsd-purple";

export function AdminAddPartnerPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const createPartner = useMutation(api.partners.create);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { partner_type: "sign_shop" },
    });

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

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await createPartner({
        company_name:  data.company_name,
        contact_name:  data.contact_name,
        email:         data.email,
        phone:         data.phone,
        partner_type:  data.partner_type,
        auth_token:    data.auth_token,   // hash this with bcrypt in production
        portal_slug:   data.portal_slug,
        tier:          "partner" as any,
        discount_pct:  15,
      });
      navigate("/admin/partners");
    } catch (err: any) {
      setError(err.message ?? "Failed to create partner");
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button onClick={() => navigate("/admin/partners")}
        className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600">
        <ArrowLeft size={13} /> Back to partners
      </button>

      <form onSubmit={handleSubmit(onSubmit)}
        className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <h2 className="font-display font-semibold text-[16px] text-gray-900">Add new partner</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field name="company_name" label="Company name" required>
            <input {...register("company_name")} className={INPUT} />
          </Field>
          <Field name="contact_name" label="Primary contact" required>
            <input {...register("contact_name")} className={INPUT} />
          </Field>
          <Field name="email" label="Email address" required>
            <input {...register("email")} type="email" className={INPUT} />
          </Field>
          <Field name="phone" label="Phone number">
            <input {...register("phone")} className={INPUT} />
          </Field>
          <Field name="portal_slug" label="Portal slug" required>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-nsd-purple">
              <span className="px-2.5 py-2 bg-gray-50 text-[11px] text-gray-400 border-r border-gray-200 whitespace-nowrap">
                partners.nsd/
              </span>
              <input {...register("portal_slug")} placeholder="company-name"
                className="flex-1 px-3 py-2 text-[13px] focus:outline-none" />
            </div>
          </Field>
          <Field name="auth_token" label="Temporary password" required>
            <input {...register("auth_token")} type="password" className={INPUT} />
          </Field>
        </div>

        <Field name="partner_type" label="Partner type" required>
          <select {...register("partner_type")} className={INPUT}>
            <option value="sign_shop">Sign shop / Agency</option>
            <option value="event_company">Event company</option>
            <option value="interior_designer">Interior designer</option>
            <option value="agency">Creative agency</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
          <p className="text-[12px] font-medium text-nsd-purple">All partners start at 15% discount</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Wholesale pricing (up to 45% off) applies automatically on orders of 25+ units</p>
        </div>

        {error && (
          <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={() => navigate("/admin/partners")}
            className="text-[13px] text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex items-center gap-2 bg-nsd-purple text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60">
            {isSubmitting && <Loader2 size={13} className="animate-spin" />}
            {isSubmitting ? "Creating…" : "Create partner account"}
          </button>
        </div>
      </form>
    </div>
  );
}
