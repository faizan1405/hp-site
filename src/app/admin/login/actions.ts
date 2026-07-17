"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";

export type AdminLoginState = {
  error?: string;
};

const loginSchema = z.object({
  email: z.string().trim().max(200),
  password: z.string().min(1).max(200),
});

const GENERIC_ERROR = "Incorrect email or password.";

/**
 * Bound to `<form action>` via `useActionState` in `AdminLoginForm`. Calls
 * Auth.js's server-side `signIn()` directly (Auth.js v5 supports this from
 * Server Actions/Route Handlers) — on success it performs the redirect to
 * `/admin` itself by throwing Next.js's internal `NEXT_REDIRECT` signal,
 * which is why that case is deliberately re-thrown rather than swallowed
 * below: this is the documented Auth.js pattern for a Credentials sign-in
 * form action, not a bug.
 */
export async function adminCredentialsLogin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: GENERIC_ERROR };
  }

  try {
    await signIn("admin-credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: GENERIC_ERROR };
    }
    // Not an auth failure — most likely NEXT_REDIRECT on success. Must be
    // re-thrown so Next.js's own machinery can perform the redirect.
    throw error;
  }

  return {};
}
