"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { setUserActive, setUserRole } from "@/app/admin/(protected)/actions";
import type { UserRole } from "@/lib/db/schema";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type UserRowData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  reviewCount: number;
  enquiryCount: number;
};

export function UserRow({ user, isSelf }: { user: UserRowData; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"role" | "active" | null>(null);

  const runRoleChange = () => {
    setError(null);
    const nextRole: UserRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    startTransition(async () => {
      try {
        await setUserRole(user.id, nextRole);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
      } finally {
        setConfirmAction(null);
      }
    });
  };

  const runActiveChange = () => {
    setError(null);
    startTransition(async () => {
      try {
        await setUserActive(user.id, !user.isActive);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
      } finally {
        setConfirmAction(null);
      }
    });
  };

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
            {user.image ? (
              <Image src={user.image} alt="" fill sizes="36px" className="object-cover" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-600">
                {(user.name ?? user.email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{user.name ?? "—"}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={user.role === "ADMIN" ? "indigo" : "gray"}>{user.role}</StatusBadge>
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={user.isActive ? "green" : "red"}>
          {user.isActive ? "Active" : "Inactive"}
        </StatusBadge>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {dateFormatter.format(new Date(user.createdAt))}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {user.lastLoginAt ? dateFormatter.format(new Date(user.lastLoginAt)) : "Never"}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{user.reviewCount}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{user.enquiryCount}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || isSelf}
              onClick={() => setConfirmAction("role")}
              title={isSelf ? "You can't change your own role." : undefined}
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              {user.role === "ADMIN" ? "Remove admin" : "Make admin"}
            </button>
            <button
              type="button"
              disabled={pending || isSelf}
              onClick={() => setConfirmAction("active")}
              title={isSelf ? "You can't deactivate your own account." : undefined}
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              {user.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
          {error && <p className="max-w-[16rem] text-[0.7rem] text-red-600">{error}</p>}
        </div>

        {/* Rendered inside this <td> rather than as a sibling of it — a <tr>
            may only contain <td>/<th>, and a <dialog> sibling would be
            fostered out of the table by the HTML parser. */}
        <ConfirmDialog
          open={confirmAction === "role"}
          title={user.role === "ADMIN" ? "Remove admin access?" : "Make this user an admin?"}
          description={
            user.role === "ADMIN"
              ? `${user.name ?? user.email} will lose access to the admin panel.`
              : `${user.name ?? user.email} will get full access to the admin panel, including users, reviews and settings.`
          }
          confirmLabel={user.role === "ADMIN" ? "Remove admin" : "Make admin"}
          danger={user.role === "ADMIN"}
          pending={pending}
          onConfirm={runRoleChange}
          onCancel={() => setConfirmAction(null)}
        />
        <ConfirmDialog
          open={confirmAction === "active"}
          title={user.isActive ? "Deactivate this account?" : "Activate this account?"}
          description={
            user.isActive
              ? `${user.name ?? user.email} will no longer be able to sign in.`
              : `${user.name ?? user.email} will be able to sign in again.`
          }
          confirmLabel={user.isActive ? "Deactivate" : "Activate"}
          danger={user.isActive}
          pending={pending}
          onConfirm={runActiveChange}
          onCancel={() => setConfirmAction(null)}
        />
      </td>
    </tr>
  );
}
