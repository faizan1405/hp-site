"use client";

import Image from "next/image";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMediaAsset } from "@/app/admin/media/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { CloudinaryListedAsset } from "@/lib/cloudinary";

function MediaCard({ image }: { image: CloudinaryListedAsset }) {
  const router = useRouter();
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [replacing, setReplacing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — copy the URL manually.");
    }
  };

  const handleReplace = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setReplacing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("replacePublicId", image.publicId);
      const response = await fetch("/api/upload/site", { method: "POST", body: formData });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Replace failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Replace failed.");
    } finally {
      setReplacing(false);
    }
  };

  const confirmDeleteAsset = () => {
    startTransition(async () => {
      try {
        await deleteMediaAsset(image.publicId);
        setConfirmDelete(false);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Delete failed.");
        setConfirmDelete(false);
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-square bg-gray-100">
        <Image src={image.url} alt="" fill sizes="200px" className="object-cover" />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <p className="truncate font-mono text-[0.65rem] text-gray-500" title={image.publicId}>
          {image.publicId}
        </p>
        <p className="text-[0.65rem] text-gray-400">
          {image.width}×{image.height} · {image.format.toUpperCase()}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={copyUrl}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? "Copied" : "Copy URL"}
          </button>
          <label
            htmlFor={inputId}
            className="cursor-pointer rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {replacing ? "Replacing…" : "Replace"}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleReplace}
            disabled={replacing}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
        {error && <p className="text-[0.65rem] text-red-600">{error}</p>}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this image?"
        description="This removes it from Cloudinary permanently. Any page still linking to it will show a broken image."
        confirmLabel="Delete"
        danger
        pending={pending}
        onConfirm={confirmDeleteAsset}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export function MediaGrid({ images }: { images: CloudinaryListedAsset[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => (
        <MediaCard key={image.publicId} image={image} />
      ))}
    </div>
  );
}
