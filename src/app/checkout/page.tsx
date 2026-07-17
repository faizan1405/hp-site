import type { Metadata } from "next";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { requireSessionForPage } from "@/lib/admin";
import { customerProfilesCollection } from "@/lib/db/schema";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { SiteFooter } from "@/components/SiteFooter";
import { buyNowWhatsappHref, commerce, pageSeo, product } from "@/config/content";

export const metadata: Metadata = {
  title: pageSeo.checkout.title,
  description: pageSeo.checkout.description,
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await requireSessionForPage("/checkout");

  // See "THE NULL RULE" in content.ts: Buy Now itself is hidden on the
  // homepage while there's no real amount to charge, but a visitor could
  // still land here directly — so this page must make the same call.
  if (!commerce.amountInPaise) {
    return (
      <main className="relative flex min-h-screen flex-col bg-navy-900">
        <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="font-display text-3xl leading-[1.05] font-light text-balance text-ice sm:text-4xl">
            Online ordering isn&apos;t open yet
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-silver">
            We&apos;re finalising checkout for {product.name}. Enquire on WhatsApp in the
            meantime and our team will help you order directly.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={buyNowWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#25D366] px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-[#22c15e]"
            >
              Enquire on WhatsApp
            </a>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-medium tracking-wide text-ice transition-colors hover:bg-white/10"
            >
              Back to home
            </Link>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const profile = await (await customerProfilesCollection()).findOne({
    userId: new ObjectId(session.user.id),
  });

  return (
    <main className="relative min-h-screen bg-navy-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(111,191,230,0.16)_0%,rgba(111,191,230,0.05)_45%,transparent_75%)]"
      />

      <section className="mx-auto max-w-2xl px-6 pt-28 pb-8 sm:pt-36">
        <p className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase">
          Checkout
        </p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl">
          {product.name}
        </h1>
        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-light text-ice">{commerce.price}</span>
          {commerce.priceNote && (
            <span className="text-xs tracking-wide text-silver">{commerce.priceNote}</span>
          )}
        </p>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-24">
        <div className="rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:p-8">
          <h2 className="font-display text-xl leading-tight font-light text-ice">
            Delivery details
          </h2>
          <p className="mt-2 text-sm text-silver">
            Enter where {product.name} should be delivered, then complete payment.
          </p>
          <div className="mt-6">
            <CheckoutForm
              defaultValues={{
                name: session.user.name ?? "",
                email: session.user.email ?? "",
                phone: profile?.phone ?? "",
                address: profile?.address ?? "",
                city: profile?.city ?? "",
                state: profile?.state ?? "",
                postalCode: profile?.postalCode ?? "",
              }}
            />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
