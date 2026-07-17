"use client";

import { useId, useRef, useState } from "react";

/**
 * Persists a contact enquiry through `POST /api/contact` (server-side Zod
 * validation, honeypot check, rate limiting — see that route). Client-side
 * validation here is purely for immediate feedback; the server never trusts
 * it and re-validates everything.
 */

type Errors = Partial<Record<"name" | "email" | "message", string>>;
type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-navy-800/60 px-4 py-3 text-sm text-ice placeholder:text-silver-dim focus:border-glacier-500/60 focus:outline-none";
const labelClass = "text-sm font-medium text-silver";

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = (data.get("name") as string)?.trim() ?? "";
    const email = (data.get("email") as string)?.trim() ?? "";
    const message = (data.get("message") as string)?.trim() ?? "";
    const company = (data.get("company") as string)?.trim() ?? "";

    const nextErrors: Errors = {};
    if (!name) nextErrors.name = "Please enter your name.";
    if (!email) nextErrors.email = "Please enter your email.";
    else if (!EMAIL_RE.test(email))
      nextErrors.email = "Please enter a valid email address.";
    if (!message) nextErrors.message = "Please enter a message.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setServerMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, company }),
      });

      if (response.ok) {
        setStatus("success");
        form.reset();
        return;
      }

      if (response.status === 400) {
        const body = (await response.json()) as {
          fieldErrors?: Record<string, string[]>;
        };
        const fieldErrors: Errors = {};
        for (const [field, messages] of Object.entries(body.fieldErrors ?? {})) {
          if (messages?.[0] && (field === "name" || field === "email" || field === "message")) {
            fieldErrors[field] = messages[0];
          }
        }
        setErrors(fieldErrors);
        setStatus("error");
        setServerMessage("Please check the highlighted fields.");
        return;
      }

      if (response.status === 429) {
        setStatus("error");
        setServerMessage("You've sent a few messages already — please try again shortly.");
        return;
      }

      setStatus("error");
      setServerMessage("Something went wrong sending your message. Please try again.");
    } catch {
      setStatus("error");
      setServerMessage("Something went wrong sending your message. Please try again.");
    }
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
        disabled={status === "submitting"}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-ice px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-white disabled:opacity-70"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>

      <p
        role="status"
        aria-live="polite"
        className={`text-sm ${
          status === "success"
            ? "text-glacier-300"
            : status === "error"
              ? "text-red-300"
              : "sr-only"
        }`}
      >
        {status === "success"
          ? "Thanks — your message has been sent to our team. We'll get back to you soon."
          : status === "error"
            ? serverMessage
            : ""}
      </p>
    </form>
  );
}
