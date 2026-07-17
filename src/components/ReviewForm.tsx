"use client";

import { useId, useState } from "react";
import { contact } from "@/config/content";

/**
 * A review-submission form that is honest about the absence of a backend. There
 * is no reviews API, database or moderation service in this project, so this
 * form does NOT claim to persist a review. It validates, then hands the review
 * to our team via the visitor's own mail client (`mailto:`) so a real person can
 * moderate and publish it. When a real reviews backend exists, swap the mailto
 * handoff in `handleSubmit` for a POST to it — validation and state are unchanged.
 */

type Errors = Partial<Record<"name" | "rating" | "text", string>>;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-navy-800/60 px-4 py-3 text-sm text-ice placeholder:text-silver-dim focus:border-glacier-500/60 focus:outline-none";
const labelClass = "text-sm font-medium text-silver";

export function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const nameId = useId();
  const textId = useId();
  const ratingErrorId = useId();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if ((data.get("company") as string)?.trim()) return; // honeypot

    const name = (data.get("name") as string)?.trim() ?? "";
    const text = (data.get("text") as string)?.trim() ?? "";

    const nextErrors: Errors = {};
    if (!name) nextErrors.name = "Please enter your name.";
    if (rating < 1) nextErrors.rating = "Please choose a star rating.";
    if (!text) nextErrors.text = "Please write your review.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (contact.email) {
      const subject = encodeURIComponent(`New review from ${name} (${rating}/5)`);
      const body = encodeURIComponent(
        `Rating: ${rating}/5\n\n${text}\n\n— ${name}`,
      );
      window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    }
    setStatus("success");
    form.reset();
    setRating(0);
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="review-company">Company</label>
        <input id="review-company" type="text" name="company" tabIndex={-1} autoComplete="off" />
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
          className={fieldClass}
          placeholder="Your name"
        />
        {errors.name && <p className="mt-1.5 text-xs text-red-300">{errors.name}</p>}
      </div>

      {/* Star rating as an accessible radio group. */}
      <fieldset aria-describedby={errors.rating ? ratingErrorId : undefined}>
        <legend className={labelClass}>Rating</legend>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="cursor-pointer p-1"
              title={`${value} star${value > 1 ? "s" : ""}`}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <svg
                viewBox="0 0 24 24"
                className={`h-7 w-7 transition-colors ${
                  value <= rating ? "text-glacier-300" : "text-silver-dim/40"
                }`}
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.48-.94L12 2.5Z" />
              </svg>
              <span className="sr-only">
                {value} star{value > 1 ? "s" : ""}
              </span>
            </label>
          ))}
        </div>
        {errors.rating && (
          <p id={ratingErrorId} className="mt-1.5 text-xs text-red-300">
            {errors.rating}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor={textId} className={labelClass}>
          Your review
        </label>
        <textarea
          id={textId}
          name="text"
          rows={5}
          aria-invalid={Boolean(errors.text)}
          className={`${fieldClass} resize-y`}
          placeholder="Tell us about your experience"
        />
        {errors.text && <p className="mt-1.5 text-xs text-red-300">{errors.text}</p>}
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-ice px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-white"
      >
        Submit for moderation
      </button>

      <p
        role="status"
        aria-live="polite"
        className={`text-sm ${status === "success" ? "text-glacier-300" : "sr-only"}`}
      >
        {status === "success"
          ? "Thanks — your email app should have opened with your review ready to send to our team for moderation. Approved reviews are published on this page."
          : ""}
      </p>
    </form>
  );
}
