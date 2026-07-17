"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/(protected)/actions";
import type { OrderStatus } from "@/lib/db/schema";
import { StatusBadge, type BadgeTone } from "@/components/admin/StatusBadge";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusTones: Record<OrderStatus, BadgeTone> = {
  PENDING_PAYMENT: "amber",
  PAID: "green",
  PAYMENT_FAILED: "red",
  CANCELLED: "gray",
};

const ALL_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PAYMENT_FAILED", "CANCELLED"];

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  razorpayPaymentId: string | null;
  createdAt: string;
};

export function OrderRow({ order }: { order: Order }) {
  const [pending, startTransition] = useTransition();

  const setStatus = (status: OrderStatus) => {
    startTransition(async () => {
      await updateOrderStatus(order.id, status);
    });
  };

  const amountDisplay = (order.amount / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: order.currency,
    maximumFractionDigits: 0,
  });

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {order.orderNumber} · {order.productName}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {order.customerName} · {order.email} · {order.phone}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{amountDisplay}</span>
          <StatusBadge tone={statusTones[order.status]}>
            {order.status.replace("_", " ")}
          </StatusBadge>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-700">
        {order.address}, {order.city}, {order.state} {order.postalCode}
      </p>

      <p className="mt-3 text-[0.7rem] text-gray-400">
        {dateFormatter.format(new Date(order.createdAt))}
        {order.razorpayPaymentId ? ` · Razorpay payment ${order.razorpayPaymentId}` : ""}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
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
    </li>
  );
}
