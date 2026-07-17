import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { reviewsCollection } from "@/lib/db/schema";
import { PageBackground } from "@/components/PageBackground";
import { ReviewForm } from "@/components/ReviewForm";
import { SiteFooter } from "@/components/SiteFooter";
import { pageBackgrounds, pageSeo, reviews } from "@/config/content";

export const metadata: Metadata = {
  title: pageSeo.reviews.title,
  description: pageSeo.reviews.description,
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: pageSeo.reviews.title,
    description: pageSeo.reviews.description,
    url: "/reviews",
  },
  twitter: {
    card: "summary_large_image",
    title: pageSeo.reviews.title,
    description: pageSeo.reviews.description,
  },
};

/** Real, moderated reviews only — read fresh on every request rather than
 * risking a build-time snapshot going stale as moderation happens. */
export const dynamic = "force-dynamic";

/** Renders a row of five stars, filling `count` of them. */
function Stars({ count }: { count: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${count} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <svg
          key={value}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${value <= count ? "text-glacier-300" : "text-silver-dim/30"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.48-.94L12 2.5Z" />
        </svg>
      ))}
    </span>
  );
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

async function getApprovedReviews() {
  const collection = await reviewsCollection();
  const docs = await collection
    .find({ status: "APPROVED" })
    .sort({ approvedAt: -1, createdAt: -1 })
    .limit(60)
    .toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.customerName,
    rating: doc.rating,
    title: doc.title,
    text: doc.text,
    date: (doc.approvedAt ?? doc.createdAt).toISOString(),
    verifiedPurchase: doc.isVerifiedPurchase,
    images: doc.images,
  }));
}

export default async function ReviewsPage() {
  const [session, approved] = await Promise.all([auth(), getApprovedReviews()]);

  return (
    <main className="relative min-h-screen bg-navy-900">
      <PageBackground src={pageBackgrounds.reviews} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(111,191,230,0.16)_0%,rgba(111,191,230,0.05)_45%,transparent_75%)]"
      />

      <section className="mx-auto max-w-3xl px-6 pt-28 pb-12 text-center sm:pt-36">
        <p className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase">
          {reviews.eyebrow}
        </p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl md:text-6xl">
          {reviews.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty text-silver md:text-lg">
          {reviews.intro}
        </p>
      </section>

      {/* Approved reviews, or an honest empty state. */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        {approved.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-navy-900/70 p-10 text-center">
            <p className="text-base leading-relaxed text-pretty text-silver">
              {reviews.emptyState}
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {approved.map((review) => (
              <li key={review.id} className="rounded-2xl border border-white/15 bg-navy-900/70 p-6">
                <div className="flex items-center justify-between gap-3">
                  <Stars count={review.rating} />
                  {review.verifiedPurchase && (
                    <span className="rounded-full border border-glacier-500/30 bg-glacier-500/10 px-2.5 py-0.5 text-[0.65rem] tracking-wide text-glacier-300 uppercase">
                      Verified purchase
                    </span>
                  )}
                </div>
                {review.title && (
                  <p className="mt-3 font-display text-lg leading-tight font-light text-ice">
                    {review.title}
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-pretty text-silver">
                  {review.text}
                </p>
                {review.images.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {review.images.map((image) => (
                      <div
                        key={image.publicId}
                        className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10"
                      >
                        <Image
                          src={image.url}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-sm text-ice">{review.name}</p>
                <p className="text-[0.7rem] text-silver-dim">
                  {dateFormatter.format(new Date(review.date))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Submission form — signed-in users only. */}
      <section className="mx-auto max-w-2xl px-6 pb-24">
        <div className="rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-tight font-light text-ice md:text-3xl">
            {reviews.formHeading}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-pretty text-silver">
            {reviews.formIntro}
          </p>
          <div className="mt-6">
            {session?.user ? (
              <ReviewForm />
            ) : (
              <div className="flex flex-col items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm leading-relaxed text-pretty text-silver">
                  Sign in with Google to write a review — this keeps reviews
                  tied to a real account.
                </p>
                <Link
                  href={`/signin?callbackUrl=${encodeURIComponent("/reviews")}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-ice px-6 py-2.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-white"
                >
                  Sign in to write a review
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
