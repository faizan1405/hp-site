"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { deleteReview, moderateReview } from "@/app/admin/actions";
import type { CloudinaryImageRef, ReviewStatus } from "@/lib/db/schema";
import { StatusBadge, type BadgeTone } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const statusTones: Record<ReviewStatus, BadgeTone> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  HIDDEN: "gray",
};

type Review = {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  text: string;
  images: CloudinaryImageRef[];
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  adminNote: string | null;
  createdAt: string;
};

export function ReviewRow({ review }: { review: Review }) {
  const [note, setNote] = useState(review.adminNote ?? "");
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const setStatus = (status: ReviewStatus) => {
    startTransition(async () => {
      await moderateReview(review.id, status, note || undefined);
    });
  };

  const confirmDeleteReview = () => {
    startTransition(async () => {
      await deleteReview(review.id);
      setConfirmDelete(false);
      setDeleted(true);
    });
  };

  if (deleted) return null;

  const forwardActions: { status: ReviewStatus; label: string }[] =
    review.status === "PENDING"
      ? [
          { status: "APPROVED", label: "Approve" },
          { status: "REJECTED", label: "Reject" },
        ]
      : review.status === "APPROVED"
        ? [
            { status: "HIDDEN", label: "Hide" },
            { status: "REJECTED", label: "Reject" },
          ]
        : [{ status: "APPROVED", label: "Restore" }];

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {review.title ?? `${review.rating} / 5`} · {review.customerName}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
            {review.isVerifiedPurchase ? " · Verified purchase" : ""}
          </p>
        </div>
        <StatusBadge tone={statusTones[review.status]}>{review.status}</StatusBadge>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-700">{review.text}</p>

      {review.images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.images.map((image) => (
            <a
              key={image.publicId}
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-14 w-14 overflow-hidden rounded-lg border border-gray-200"
              title="Open full image"
            >
              <Image src={image.url} alt="" fill sizes="56px" className="object-cover" />
            </a>
          ))}
        </div>
      )}

      <p className="mt-2 text-[0.7rem] text-gray-400">{dateFormatter.format(new Date(review.createdAt))}</p>

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
        <div>
          <label className="text-xs font-medium text-gray-500" htmlFor={`review-note-${review.id}`}>
            Admin note
          </label>
          <input
            id={`review-note-${review.id}`}
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Internal note (optional) — saved with your next status change"
            maxLength={500}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-glacier-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {forwardActions.map((action) => (
              <button
                key={action.status}
                type="button"
                disabled={pending}
                onClick={() => setStatus(action.status)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this review?"
        description="This permanently removes the review and its images. This can't be undone."
        confirmLabel="Delete"
        danger
        pending={pending}
        onConfirm={confirmDeleteReview}
        onCancel={() => setConfirmDelete(false)}
      />
    </li>
  );
}
