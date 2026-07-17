"use client";

import { useId, useRef, useState } from "react";
import { contact } from "@/config/content";

/**
 * A contact form that is honest about what it can and cannot do. There is no
 * email service, API or database wired to this site, so this form does NOT claim
 * to store or send anything server-side. Instead it validates client-side and,
 * on success, opens the visitor's own mail client with the message pre-filled
 * (`mailto:`) — a real action the visitor completes, not a fake "submitted!"
 * that goes nowhere.
 *
 * Spam protection: a hidden honeypot field (`company`) that a human never sees
 * and never fills; a submission that fills it is silently dropped. Wiring this
 * to a real backend later means replacing `handleSubmit`'s mailto handoff with a
 * fetch to that endpoint — the validation and state below stay as they are.
 */

type Errors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-navy-800/60 px-4 py-3 text-sm text-ice placeholder:text-silver-dim focus:border-glacier-500/60 focus:outline-none";
const labelClass = "text-sm font-medium text-silver";

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const honeypotRef = useRef<HTMLInputElement>(null);

  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot: if this hidden field is filled, treat as spam and drop silently.
    if ((data.get("company") as string)?.trim()) return;

    const name = (data.get("name") as string)?.trim() ?? "";
    const email = (data.get("email") as string)?.trim() ?? "";
    const message = (data.get("message") as string)?.trim() ?? "";

    const nextErrors: Errors = {};
    if (!name) nextErrors.name = "Please enter your name.";
    if (!email) nextErrors.email = "Please enter your email.";
    else if (!EMAIL_RE.test(email))
      nextErrors.email = "Please enter a valid email address.";
    if (!message) nextErrors.message = "Please enter a message.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // No backend: hand off to the visitor's mail client with everything filled.
    if (contact.email) {
      const subject = encodeURIComponent(`Enquiry from ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
      window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    }
    setStatus("success");
    form.reset();
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Honeypot — visually hidden and off the tab order; bots fill it, people don't. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="company-field">Company</label>
        <input
          ref={honeypotRef}
          id="company-field"
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor={nameId} className={labelClass}>
          Name
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${nameId}-error` : undefined}
          className={fieldClass}
          placeholder="Your name"
        />
        {errors.name && (
          <p id={`${nameId}-error`} className="mt-1.5 text-xs text-red-300">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={emailId} className={labelClass}>
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          className={fieldClass}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id={`${emailId}-error`} className="mt-1.5 text-xs text-red-300">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={messageId} className={labelClass}>
          Message
        </label>
        <textarea
          id={messageId}
          name="message"
          rows={5}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${messageId}-error` : undefined}
          className={`${fieldClass} resize-y`}
          placeholder="How can we help?"
        />
        {errors.message && (
          <p id={`${messageId}-error`} className="mt-1.5 text-xs text-red-300">
            {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-ice px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-white"
      >
        Send message
      </button>

      {/* Success is worded truthfully: it opened your mail app; it did not store
          anything on a server, because there is no server to store it on. */}
      <p
        role="status"
        aria-live="polite"
        className={`text-sm ${status === "success" ? "text-glacier-300" : "sr-only"}`}
      >
        {status === "success"
          ? "Thanks — your email app should have opened with your message ready to send. If it didn't, please email or WhatsApp us using the details above."
          : ""}
      </p>
    </form>
  );
}
