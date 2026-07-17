"use client";

import Image from "next/image";
import { useId, useState, useTransition } from "react";
import { setProfileImage } from "@/app/dashboard/actions";

export function ProfileImageUploader({
  currentImageUrl,
  fallbackLabel,
}: {
  currentImageUrl: string | null;
  fallbackLabel: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputId = useId();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/upload/profile", { method: "POST", body: formData });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Upload failed.");
        return;
      }

      const uploaded = (await response.json()) as {
        url: string;
        publicId: string;
        width: number;
        height: number;
        format: string;
      };

      setPreviewUrl(uploaded.url);
      startTransition(async () => {
        try {
          await setProfileImage(uploaded);
        } catch {
          setError("Couldn't save your new photo. Please try again.");
        }
      });
    } catch {
      setError("Upload failed.");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/15 bg-navy-800">
        {previewUrl ? (
          <Image src={previewUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-lg text-ice">
            {fallbackLabel.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div>
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-ice transition-colors hover:bg-white/10"
        >
          {pending ? "Saving…" : "Change photo"}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="sr-only"
        />
        {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
      </div>
    </div>
  );
}
