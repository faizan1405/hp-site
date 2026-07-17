import Link from "next/link";
import {
  contactEnquiriesCollection,
  reviewsCollection,
  usersCollection,
} from "@/lib/db/schema";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge, type BadgeTone } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const enquiryToneByStatus: Record<string, BadgeTone> = {
  NEW: "blue",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
  SPAM: "red",
};

async function getDashboardData() {
  const [users, enquiries, reviews] = await Promise.all([
    usersCollection(),
    contactEnquiriesCollection(),
    reviewsCollection(),
  ]);

  const [
    totalUsers,
    newEnquiries,
    pendingReviews,
    approvedReviews,
    recentEnquiries,
    recentPendingReviews,
  ] = await Promise.all([
    users.countDocuments({}),
    enquiries.countDocuments({ status: "NEW" }),
    reviews.countDocuments({ status: "PENDING" }),
    reviews.countDocuments({ status: "APPROVED" }),
    enquiries.find({}).sort({ createdAt: -1 }).limit(5).toArray(),
    reviews.find({ status: "PENDING" }).sort({ createdAt: -1 }).limit(5).toArray(),
  ]);

  return {
    counts: {
      totalUsers,
      newEnquiries,
      pendingReviews,
      approvedReviews,
    },
    recentEnquiries,
    recentPendingReviews,
  };
}

export default async function AdminOverviewPage() {
  const { counts, recentEnquiries, recentPendingReviews } = await getDashboardData();

  const cards = [
    { label: "Total users", value: counts.totalUsers, href: "/admin/users" },
    { label: "New enquiries", value: counts.newEnquiries, href: "/admin/enquiries?status=NEW" },
    {
      label: "Pending reviews",
      value: counts.pendingReviews,
      href: "/admin/reviews?status=PENDING",
    },
    {
      label: "Approved reviews",
      value: counts.approvedReviews,
      href: "/admin/reviews?status=APPROVED",
    },
  ];

  const quickLinks = [
    { label: "Review new enquiries", href: "/admin/enquiries?status=NEW" },
    { label: "Moderate pending reviews", href: "/admin/reviews?status=PENDING" },
    { label: "Manage users", href: "/admin/users" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminHeader title="Dashboard" description="A snapshot of what needs attention today." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} href={card.href} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent enquiries</h2>
            <Link href="/admin/enquiries" className="text-sm text-glacier-600 hover:underline">
              View all
            </Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <EmptyState title="No enquiries yet" />
          ) : (
            <ul className="flex flex-col gap-2">
              {recentEnquiries.map((enquiry) => (
                <li
                  key={enquiry._id.toString()}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {enquiry.subject ?? enquiry.name}
                    </p>
                    <StatusBadge tone={enquiryToneByStatus[enquiry.status] ?? "gray"}>
                      {enquiry.status.replace("_", " ")}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {enquiry.name} · {dateFormatter.format(enquiry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent pending reviews</h2>
            <Link href="/admin/reviews?status=PENDING" className="text-sm text-glacier-600 hover:underline">
              View all
            </Link>
          </div>
          {recentPendingReviews.length === 0 ? (
            <EmptyState title="No reviews waiting for moderation" />
          ) : (
            <ul className="flex flex-col gap-2">
              {recentPendingReviews.map((review) => (
                <li
                  key={review._id.toString()}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {review.customerName} · {review.rating}/5
                    </p>
                    <StatusBadge tone="amber">Pending</StatusBadge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">{review.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
