"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CheckoutDefaults = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-navy-800/60 px-4 py-3 text-sm text-ice placeholder:text-silver-dim focus:border-glacier-500/60 focus:outline-none";
const labelClass = "text-sm font-medium text-silver";

export function CheckoutForm({ defaultValues }: { defaultValues: CheckoutDefaults }) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!scriptReady || !window.Razorpay) {
      setError("Payment is still loading. Please try again in a moment.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setFieldErrors(data.fieldErrors ?? {});
        setSubmitting(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: data.productName,
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: data.customerName,
          email: data.customerEmail,
          contact: data.customerPhone,
        },
        theme: { color: "#6fbfe6" },
        handler: async (verifyResponse) => {
          try {
            const verify = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(verifyResponse),
            });
            const verifyData = await verify.json();
            if (verify.ok && verifyData.success) {
              router.push(`/checkout/success?order=${encodeURIComponent(verifyData.orderNumber)}`);
            } else {
              setError("We couldn't confirm your payment. Please contact support with your order number.");
              setSubmitting(false);
            }
          } catch {
            setError("We couldn't confirm your payment. Please contact support with your order number.");
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      });

      razorpay.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClass}>
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={defaultValues.name}
              className={fieldClass}
            />
            {fieldErrors.name && (
              <p className="mt-1.5 text-xs text-red-300">{fieldErrors.name[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={defaultValues.phone}
              className={fieldClass}
            />
            {fieldErrors.phone && (
              <p className="mt-1.5 text-xs text-red-300">{fieldErrors.phone[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={defaultValues.email}
            className={fieldClass}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-red-300">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="address" className={labelClass}>
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            defaultValue={defaultValues.address}
            className={fieldClass}
            placeholder="Street address"
          />
          {fieldErrors.address && (
            <p className="mt-1.5 text-xs text-red-300">{fieldErrors.address[0]}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className={labelClass}>
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              defaultValue={defaultValues.city}
              className={fieldClass}
            />
            {fieldErrors.city && (
              <p className="mt-1.5 text-xs text-red-300">{fieldErrors.city[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="state" className={labelClass}>
              State
            </label>
            <input
              id="state"
              name="state"
              type="text"
              required
              defaultValue={defaultValues.state}
              className={fieldClass}
            />
            {fieldErrors.state && (
              <p className="mt-1.5 text-xs text-red-300">{fieldErrors.state[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="postalCode" className={labelClass}>
              PIN code
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              required
              defaultValue={defaultValues.postalCode}
              className={fieldClass}
            />
            {fieldErrors.postalCode && (
              <p className="mt-1.5 text-xs text-red-300">{fieldErrors.postalCode[0]}</p>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ice px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-white disabled:opacity-70"
          >
            {submitting ? "Opening payment…" : "Proceed to payment"}
          </button>
          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
      </form>
    </>
  );
}
