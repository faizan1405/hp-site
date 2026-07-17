"use client";

import Image from "next/image";
import { useId, useState, useTransition } from "react";
import { setFounderPortrait } from "@/app/admin/(protected)/settings/actions";

export function FounderPortraitUploader({ currentImageUrl }: { currentImageUrl: string | null }) {
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
      formData.set("folder", "founder");
      const response = await fetch("/api/upload/site", { method: "POST", body: formData });

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
          await setFounderPortrait(uploaded);
        } catch {
          setError("Couldn't save the new portrait. Please try again.");
        }
      });
    } catch {
      setError("Upload failed.");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
        {previewUrl ? (
          <Image src={previewUrl} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs text-gray-400">No photo</span>
        )}
      </div>
      <div>
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {pending ? "Saving…" : "Change portrait"}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="sr-only"
        />
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
