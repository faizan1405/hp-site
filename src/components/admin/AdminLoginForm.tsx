"use client";

import { useActionState, useId, useState } from "react";
import { adminCredentialsLogin, type AdminLoginState } from "@/app/admin/login/actions";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-glacier-500 focus:outline-none";
const labelClass = "text-sm font-medium text-gray-700";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminCredentialsLogin, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor={emailId} className={labelClass}>
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor={passwordId} className={labelClass}>
          Password
        </label>
        <div className="relative mt-1.5">
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={200}
            className={`${fieldClass} mt-0 pr-16`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 px-3.5 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-glacier-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-glacier-600/90 disabled:opacity-70"
      >
        {pending ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
