"use client";

import { useActionState } from "react";
import { updateSettings, type SettingsActionState } from "@/app/admin/settings/actions";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-glacier-500 focus:outline-none";
const labelClass = "text-sm font-medium text-gray-700";

const initialState: SettingsActionState = {};

export type SettingsDefaults = {
  brandName: string;
  phone: string;
  whatsappNumber: string;
  whatsappMessage: string;
  email: string;
  address: string;
  businessHours: string;
  founderName: string;
  founderDesignation: string;
  contactReceiverEmail: string;
  instagram: string;
  facebook: string;
  youtube: string;
  linkedin: string;
  twitter: string;
  maintenanceMessage: string;
};

function Field({
  id,
  label,
  defaultValue,
  fieldErrors,
  type = "text",
  placeholder,
}: {
  id: keyof SettingsDefaults;
  label: string;
  defaultValue: string;
  fieldErrors?: Record<string, string[]>;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={fieldClass}
      />
      {fieldErrors?.[id] && <p className="mt-1.5 text-xs text-red-600">{fieldErrors[id][0]}</p>}
    </div>
  );
}

export function SettingsForm({ defaultValues }: { defaultValues: SettingsDefaults }) {
  const [state, formAction, pending] = useActionState(updateSettings, initialState);
  const fieldErrors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Brand &amp; contact</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="brandName" label="Brand name" defaultValue={defaultValues.brandName} fieldErrors={fieldErrors} />
          <Field id="phone" label="Phone number" defaultValue={defaultValues.phone} fieldErrors={fieldErrors} />
          <Field id="email" label="Public email" defaultValue={defaultValues.email} fieldErrors={fieldErrors} type="email" />
          <Field
            id="contactReceiverEmail"
            label="Contact-form receiver email"
            defaultValue={defaultValues.contactReceiverEmail}
            fieldErrors={fieldErrors}
            type="email"
          />
          <Field id="businessHours" label="Business hours" defaultValue={defaultValues.businessHours} fieldErrors={fieldErrors} placeholder="e.g. Open 24/7" />
          <Field id="address" label="Address" defaultValue={defaultValues.address} fieldErrors={fieldErrors} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">WhatsApp</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            id="whatsappNumber"
            label="WhatsApp number"
            defaultValue={defaultValues.whatsappNumber}
            fieldErrors={fieldErrors}
            placeholder="International format, digits only"
          />
          <Field
            id="whatsappMessage"
            label="Order message"
            defaultValue={defaultValues.whatsappMessage}
            fieldErrors={fieldErrors}
            placeholder="Pre-filled WhatsApp order message"
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Founder</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="founderName" label="Founder name" defaultValue={defaultValues.founderName} fieldErrors={fieldErrors} />
          <Field
            id="founderDesignation"
            label="Founder designation"
            defaultValue={defaultValues.founderDesignation}
            fieldErrors={fieldErrors}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Social links</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="instagram" label="Instagram" defaultValue={defaultValues.instagram} fieldErrors={fieldErrors} placeholder="https://instagram.com/…" />
          <Field id="facebook" label="Facebook" defaultValue={defaultValues.facebook} fieldErrors={fieldErrors} placeholder="https://facebook.com/…" />
          <Field id="youtube" label="YouTube" defaultValue={defaultValues.youtube} fieldErrors={fieldErrors} placeholder="https://youtube.com/…" />
          <Field id="linkedin" label="LinkedIn" defaultValue={defaultValues.linkedin} fieldErrors={fieldErrors} placeholder="https://linkedin.com/…" />
          <Field id="twitter" label="X / Twitter" defaultValue={defaultValues.twitter} fieldErrors={fieldErrors} placeholder="https://x.com/…" />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Maintenance</h2>
        <p className="mt-1 text-xs text-gray-500">
          A short note for internal reference — this does not take the site offline.
        </p>
        <div className="mt-4">
          <Field
            id="maintenanceMessage"
            label="Maintenance message"
            defaultValue={defaultValues.maintenanceMessage}
            fieldErrors={fieldErrors}
            placeholder="e.g. Shipping paused until 12 Aug"
          />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-glacier-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-glacier-600/90 disabled:opacity-70"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
        <p role="status" aria-live="polite" className="text-sm text-gray-600">
          {state.success ? "Saved." : (state.error ?? "")}
        </p>
      </div>
    </form>
  );
}
