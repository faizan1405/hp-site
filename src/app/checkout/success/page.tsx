import type { Metadata } from "next";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { requireSessionForPage } from "@/lib/admin";
import { ordersCollection } from "@/lib/db/schema";
import { SiteFooter } from "@/components/SiteFooter";
import { buyNowWhatsappHref } from "@/config/content";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const session = await requireSessionForPage("/checkout/success");
  const { order: orderNumber } = await searchParams;

  const order = orderNumber
    ? await (await ordersCollection()).findOne({
        orderNumber,
        userId: new ObjectId(session.user.id),
      })
    : null;

  return (
    <main className="relative flex min-h-screen flex-col bg-navy-900">
      <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        {order && order.status === "PAID" ? (
          <>
            <p className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase">
              Order confirmed
            </p>
            <h1 className="mt-4 font-display text-3xl leading-[1.05] font-light text-balance text-ice sm:text-4xl">
              Thank you, {order.customerName.split(" ")[0]}.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-silver">
              Your order <span className="text-ice">{order.orderNumber}</span> for{" "}
              {order.productName} is confirmed and will be delivered to {order.address},{" "}
              {order.city}. We&apos;ll be in touch with delivery updates.
            </p>
            <p className="mt-2 text-xs text-silver-dim">
              Placed on {dateFormatter.format(order.createdAt)}
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl leading-[1.05] font-light text-balance text-ice sm:text-4xl">
              We&apos;re confirming your payment
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-silver">
              If you completed payment and this doesn&apos;t update shortly, message us on
              WhatsApp with your order number and we&apos;ll confirm it directly.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={buyNowWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#25D366] px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-[#22c15e]"
          >
            Message us on WhatsApp
          </a>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-medium tracking-wide text-ice transition-colors hover:bg-white/10"
          >
            Go to your account
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
