"use client";

import { useState, useTransition } from "react";
import { deleteEnquiry, updateEnquiryNote, updateEnquiryStatus } from "@/app/admin/actions";
import type { ContactEnquiryStatus } from "@/lib/db/schema";
import { StatusBadge, type BadgeTone } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusTones: Record<ContactEnquiryStatus, BadgeTone> = {
  NEW: "blue",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
  SPAM: "red",
};

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactEnquiryStatus;
  adminNote: string | null;
  source: string;
  createdAt: string;
  hasAccount: boolean;
};

export function EnquiryRow({ enquiry }: { enquiry: Enquiry }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(enquiry.adminNote ?? "");
  const [noteSaved, setNoteSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const setStatus = (status: ContactEnquiryStatus) => {
    startTransition(async () => {
      await updateEnquiryStatus(enquiry.id, status);
    });
  };

  const saveNote = () => {
    setNoteSaved(false);
    startTransition(async () => {
      await updateEnquiryNote(enquiry.id, note);
      setNoteSaved(true);
    });
  };

  const confirmDeleteEnquiry = () => {
    startTransition(async () => {
      await deleteEnquiry(enquiry.id);
      setConfirmDelete(false);
      setDeleted(true);
    });
  };

  if (deleted) return null;

  const phoneDigits = enquiry.phone?.replace(/[^\d+]/g, "");
  const whatsappHref = phoneDigits
    ? `https://wa.me/${phoneDigits.replace(/^\+/, "")}`
    : null;

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{enquiry.subject ?? "General enquiry"}</p>
          <p className="mt-1 text-xs text-gray-500">
            {enquiry.name} · {enquiry.email}
            {enquiry.phone ? ` · ${enquiry.phone}` : ""}
            {enquiry.hasAccount ? " · has an account" : ""}
          </p>
        </div>
        <StatusBadge tone={statusTones[enquiry.status]}>
          {enquiry.status.replace("_", " ")}
        </StatusBadge>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-700">{enquiry.message}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`mailto:${enquiry.email}`}
          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Email
        </a>
        {enquiry.phone && (
          <a
            href={`tel:${phoneDigits}`}
            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Call
          </a>
        )}
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            WhatsApp
          </a>
        )}
      </div>

      <p className="mt-3 text-[0.7rem] text-gray-400">
        {dateFormatter.format(new Date(enquiry.createdAt))} · {enquiry.source}
      </p>

      <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
        <label className="text-xs font-medium text-gray-500" htmlFor={`note-${enquiry.id}`}>
          Internal note (not visible to the visitor)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id={`note-${enquiry.id}`}
            type="text"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setNoteSaved(false);
            }}
            maxLength={500}
            placeholder="Add a note for the team…"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-glacier-500 focus:outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={saveNote}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {noteSaved ? "Saved" : "Save note"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"] as const)
            .filter((s) => s !== enquiry.status)
            .map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                onClick={() => setStatus(s)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Mark {s.replace("_", " ").toLowerCase()}
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

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this enquiry?"
        description="This permanently removes the enquiry. This can't be undone."
        confirmLabel="Delete"
        danger
        pending={pending}
        onConfirm={confirmDeleteEnquiry}
        onCancel={() => setConfirmDelete(false)}
      />
    </li>
  );
}
