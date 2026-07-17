import type { Metadata } from "next";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { requireSessionForPage } from "@/lib/admin";
import {
  contactEnquiriesCollection,
  customerProfilesCollection,
  ordersCollection,
  reviewsCollection,
  usersCollection,
  type ContactEnquiryStatus,
  type OrderStatus,
  type ReviewStatus,
} from "@/lib/db/schema";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { ProfileImageUploader } from "@/components/dashboard/ProfileImageUploader";
import { SignOutButton } from "@/components/SignOutButton";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { buyNowWhatsappHref, dashboard, pageSeo } from "@/config/content";

export const metadata: Metadata = {
  title: pageSeo.dashboard.title,
  description: pageSeo.dashboard.description,
  alternates: { canonical: "/dashboard" },
  openGraph: {
    title: pageSeo.dashboard.title,
    description: pageSeo.dashboard.description,
    url: "/dashboard",
  },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const enquiryStatusStyles: Record<ContactEnquiryStatus, string> = {
  NEW: "border-glacier-500/30 bg-glacier-500/10 text-glacier-300",
  IN_PROGRESS: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  RESOLVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  SPAM: "border-red-400/30 bg-red-400/10 text-red-300",
};

const reviewStatusStyles: Record<ReviewStatus, string> = {
  PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  APPROVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  REJECTED: "border-red-400/30 bg-red-400/10 text-red-300",
  HIDDEN: "border-white/20 bg-white/5 text-silver-dim",
};

const orderStatusStyles: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  PAID: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  PAYMENT_FAILED: "border-red-400/30 bg-red-400/10 text-red-300",
  CANCELLED: "border-white/20 bg-white/5 text-silver-dim",
};

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[0.65rem] tracking-wide uppercase ${className}`}
    >
      {label.replace("_", " ").toLowerCase()}
    </span>
  );
}

export default async function DashboardPage() {
  const session = await requireSessionForPage("/dashboard");
  const userId = new ObjectId(session.user.id);

  const [userDoc, profile, enquiries, reviews, orders] = await Promise.all([
    (await usersCollection()).findOne({ _id: userId }),
    (await customerProfilesCollection()).findOne({ userId }),
    (await contactEnquiriesCollection())
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray(),
    (await reviewsCollection()).find({ userId }).sort({ createdAt: -1 }).limit(20).toArray(),
    (await ordersCollection()).find({ userId }).sort({ createdAt: -1 }).limit(20).toArray(),
  ]);

  const memberSince = userDoc?.createdAt ? dateFormatter.format(userDoc.createdAt) : null;

  return (
    <main className="relative min-h-screen bg-navy-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(111,191,230,0.16)_0%,rgba(111,191,230,0.05)_45%,transparent_75%)]"
      />

      <section className="mx-auto max-w-4xl px-6 pt-28 pb-8 sm:pt-36">
        <p className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase">
          {dashboard.eyebrow}
        </p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl md:text-6xl">
          {dashboard.heading}
        </h1>
      </section>

      {/* Profile summary. */}
      <section className="mx-auto max-w-4xl px-6 pb-8">
        <div className="flex flex-col gap-5 rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <ProfileImageUploader
              currentImageUrl={profile?.image?.url ?? session.user.image ?? null}
              fallbackLabel={session.user.name ?? session.user.email ?? "?"}
            />
            <div>
              <p className="font-display text-xl leading-tight font-light text-ice">
                {session.user.name ?? "Your account"}
              </p>
              <p className="text-sm text-silver">{session.user.email}</p>
              {memberSince && (
                <p className="text-[0.7rem] text-silver-dim">Member since {memberSince}</p>
              )}
            </div>
          </div>
          <SignOutButton className="inline-flex min-h-11 items-center justify-center self-start rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-medium tracking-wide text-ice transition-colors hover:bg-white/10 sm:self-center" />
        </div>
      </section>

      {/* Profile & address. */}
      <section className="mx-auto max-w-4xl px-6 pb-8">
        <div className="rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-tight font-light text-ice">
            Profile &amp; contact details
          </h2>
          <p className="mt-2 text-sm text-silver">{dashboard.features[0]?.body}</p>
          <div className="mt-6">
            <ProfileForm
              defaultValues={{
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

      {/* Your orders. */}
      <section className="mx-auto max-w-4xl px-6 pb-8">
        <div className="rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-tight font-light text-ice">Your orders</h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-silver">
              You haven&apos;t placed an order yet.{" "}
              <Link href="/#purchase" className="text-glacier-300 underline underline-offset-2">
                Buy Himalaya Sparsh
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {orders.map((order) => (
                <li
                  key={order._id.toString()}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ice">{order.orderNumber}</p>
                    <StatusBadge
                      label={order.status}
                      className={orderStatusStyles[order.status]}
                    />
                  </div>
                  <p className="mt-1.5 text-sm text-silver">
                    {order.productName} · {(order.amount / 100).toLocaleString("en-IN", {
                      style: "currency",
                      currency: order.currency,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="mt-2 text-[0.7rem] text-silver-dim">
                    {dateFormatter.format(order.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Your enquiries. */}
      <section className="mx-auto max-w-4xl px-6 pb-8">
        <div className="rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-tight font-light text-ice">
            Your enquiries
          </h2>
          {enquiries.length === 0 ? (
            <p className="mt-3 text-sm text-silver">
              You haven&apos;t sent any enquiries yet. Reach us from the{" "}
              <Link href="/contact" className="text-glacier-300 underline underline-offset-2">
                contact page
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {enquiries.map((enquiry) => (
                <li
                  key={enquiry._id.toString()}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ice">
                      {enquiry.subject ?? "General enquiry"}
                    </p>
                    <StatusBadge
                      label={enquiry.status}
                      className={enquiryStatusStyles[enquiry.status]}
                    />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-silver">{enquiry.message}</p>
                  <p className="mt-2 text-[0.7rem] text-silver-dim">
                    {dateFormatter.format(enquiry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Your reviews. */}
      <section className="mx-auto max-w-4xl px-6 pb-12">
        <div className="rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-tight font-light text-ice">
            Your reviews
          </h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-silver">
              You haven&apos;t submitted a review yet. Share your experience on the{" "}
              <Link href="/reviews" className="text-glacier-300 underline underline-offset-2">
                reviews page
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {reviews.map((review) => (
                <li
                  key={review._id.toString()}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ice">
                      {review.title ?? `${review.rating} / 5`}
                    </p>
                    <StatusBadge
                      label={review.status}
                      className={reviewStatusStyles[review.status]}
                    />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-silver">{review.text}</p>
                  {review.status === "REJECTED" && review.adminNote && (
                    <p className="mt-2 text-xs text-red-300">Note: {review.adminNote}</p>
                  )}
                  <p className="mt-2 text-[0.7rem] text-silver-dim">
                    {dateFormatter.format(review.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Support — always real links. */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <p className="font-mono text-[0.65rem] tracking-[0.3em] text-glacier-300 uppercase">
          Support
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <a
            href={buyNowWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-[#22c15e]"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" />
            WhatsApp support
          </a>
          <Link
            href="/contact"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-medium tracking-wide text-ice transition-colors hover:bg-white/10"
          >
            Contact us
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
