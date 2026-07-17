"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileActionState } from "@/app/dashboard/actions";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-navy-800/60 px-4 py-3 text-sm text-ice placeholder:text-silver-dim focus:border-glacier-500/60 focus:outline-none";
const labelClass = "text-sm font-medium text-silver";

const initialState: ProfileActionState = {};

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: {
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaultValues.phone}
            className={fieldClass}
            placeholder="Your phone number"
          />
          {state.fieldErrors?.phone && (
            <p className="mt-1.5 text-xs text-red-300">{state.fieldErrors.phone[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="postalCode" className={labelClass}>
            Postal code
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            defaultValue={defaultValues.postalCode}
            className={fieldClass}
            placeholder="PIN code"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={defaultValues.address}
          className={fieldClass}
          placeholder="Street address"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={labelClass}>
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            defaultValue={defaultValues.city}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="state" className={labelClass}>
            State
          </label>
          <input
            id="state"
            name="state"
            type="text"
            defaultValue={defaultValues.state}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-ice px-6 py-2.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-white disabled:opacity-70"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <p role="status" aria-live="polite" className="text-sm text-glacier-300">
          {state.success ? "Saved." : state.error ?? ""}
        </p>
      </div>
    </form>
  );
}
