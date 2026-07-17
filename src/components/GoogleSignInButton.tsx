"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

const googleGlyph = (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.96h5.53c-.24 1.4-1.7 4.1-5.53 4.1-3.33 0-6.04-2.76-6.04-6.16 0-3.4 2.71-6.16 6.04-6.16 1.89 0 3.16.8 3.89 1.5l2.65-2.55C16.94 3.4 14.7 2.4 12 2.4 6.98 2.4 2.9 6.5 2.9 11.5s4.08 9.1 9.1 9.1c5.25 0 8.74-3.69 8.74-8.89 0-.6-.07-1.05-.15-1.51H12Z"
    />
  </svg>
);

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("google", { callbackUrl });
      }}
      className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-ice px-6 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-white disabled:opacity-70"
    >
      {googleGlyph}
      {pending ? "Redirecting to Google…" : "Continue with Google"}
    </button>
  );
}
