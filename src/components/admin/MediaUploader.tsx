"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

export function MediaUploader({ folder }: { folder: "site" | "founder" }) {
  const router = useRouter();
  const inputId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", folder);
      const response = await fetch("/api/upload/site", { method: "POST", body: formData });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Upload failed.");
        return;
      }

      router.refresh();
    } catch {
      setError("Upload failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={inputId}
        className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {pending ? "Uploading…" : "Upload image"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        disabled={pending}
        className="sr-only"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
