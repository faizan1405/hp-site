"use client";

import { useId, useState } from "react";

/**
 * Persists a review through `POST /api/reviews` — logged-in users only (the
 * page that renders this component gates on that). New reviews start
 * PENDING and only appear on `/reviews` once an admin approves them. Images
 * are uploaded to Cloudinary one at a time as they're picked, through
 * `POST /api/upload/review`, so the review submission itself only ever
 * carries back the metadata our own server returned — never a raw file.
 */

type Errors = Partial<Record<"rating" | "text", string>>;
type Status = "idle" | "submitting" | "success" | "error";

type UploadedImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
};

type PickedImage = {
  key: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  uploaded?: UploadedImage;
  error?: string;
};

const MAX_IMAGES = 4;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-navy-800/60 px-4 py-3 text-sm text-ice placeholder:text-silver-dim focus:border-glacier-500/60 focus:outline-none";
const labelClass = "text-sm font-medium text-silver";

export function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const titleId = useId();
  const textId = useId();
  const ratingErrorId = useId();
  const imagesInputId = useId();

  const uploadOne = async (file: File) => {
    const key = `${file.name}-${file.size}-${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    setImages((current) => [...current, { key, previewUrl, status: "uploading" }]);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/upload/review", { method: "POST", body: formData });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setImages((current) =>
          current.map((image) =>
            image.key === key
              ? { ...image, status: "error", error: body?.error ?? "Upload failed." }
              : image,
          ),
        );
        return;
      }

      const uploaded = (await response.json()) as UploadedImage;
      setImages((current) =>
        current.map((image) => (image.key === key ? { ...image, status: "done", uploaded } : image)),
      );
    } catch {
      setImages((current) =>
        current.map((image) =>
          image.key === key ? { ...image, status: "error", error: "Upload failed." } : image,
        ),
      );
    }
  };

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const remaining = MAX_IMAGES - images.length;
    const files = Array.from(fileList).slice(0, Math.max(0, remaining));
    for (const file of files) void uploadOne(file);
  };

  const removeImage = (key: string) => {
    setImages((current) => current.filter((image) => image.key !== key));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if ((data.get("company") as string)?.trim()) return; // honeypot

    const title = (data.get("title") as string)?.trim() ?? "";
    const text = (data.get("text") as string)?.trim() ?? "";

    const nextErrors: Errors = {};
    if (rating < 1) nextErrors.rating = "Please choose a star rating.";
    if (!text) nextErrors.text = "Please write your review.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (images.some((image) => image.status === "uploading")) {
      setStatus("error");
      setServerMessage("Please wait for your images to finish uploading.");
      return;
    }

    setStatus("submitting");
    setServerMessage(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title,
          text,
          images: images.filter((image) => image.status === "done").map((image) => image.uploaded),
        }),
      });

      if (response.ok) {
        setStatus("success");
        form.reset();
        setRating(0);
        setImages([]);
        return;
      }

      if (response.status === 429) {
        setStatus("error");
        setServerMessage("Please wait a moment before submitting another review.");
        return;
      }

      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setServerMessage(body?.error ?? "Something went wrong submitting your review.");
    } catch {
      setStatus("error");
      setServerMessage("Something went wrong submitting your review.");
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="review-company">Company</label>
        <input id="review-company" type="text" name="company" tabIndex={-1} autoComplete="off" />
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
        <label htmlFor={titleId} className={labelClass}>
          Title <span className="text-silver-dim">(optional)</span>
        </label>
        <input
          id={titleId}
          name="title"
          type="text"
          maxLength={120}
          className={fieldClass}
          placeholder="Sum up your experience"
        />
      </div>

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

      <div>
        <label htmlFor={imagesInputId} className={labelClass}>
          Photos <span className="text-silver-dim">(optional, up to {MAX_IMAGES})</span>
        </label>
        <input
          id={imagesInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={images.length >= MAX_IMAGES}
          onChange={(event) => {
            handleFilesSelected(event.target.files);
            event.target.value = "";
          }}
          className="mt-1.5 block w-full text-sm text-silver file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-medium file:text-ice hover:file:bg-white/20"
        />
        {images.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-3">
            {images.map((image) => (
              <li key={image.key} className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/15">
                {/* Local blob preview — not the eventual Cloudinary URL, so a
                    plain <img> avoids next/image's remote-pattern check. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.previewUrl} alt="" className="h-full w-full object-cover" />
                {image.status === "uploading" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-navy-900/60 text-[0.6rem] text-ice">
                    Uploading…
                  </span>
                )}
                {image.status === "error" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-red-900/70 text-[0.55rem] text-red-100">
                    Failed
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(image.key)}
                  aria-label="Remove image"
                  className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy-900/80 text-xs text-ice"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-ice px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-white disabled:opacity-70"
      >
        {status === "submitting" ? "Submitting…" : "Submit for moderation"}
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
          ? "Thanks — your review has been sent for moderation. Approved reviews are published on this page."
          : status === "error"
            ? serverMessage
            : ""}
      </p>
    </form>
  );
}
