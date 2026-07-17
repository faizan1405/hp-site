import type { Filter } from "mongodb";
import { reviewsCollection, type ReviewDoc } from "@/lib/db/schema";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { ReviewRow } from "@/components/admin/ReviewRow";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "HIDDEN"] as const;
const PAGE_SIZE = 20;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const filter: Filter<ReviewDoc> = {};
  if (status && (STATUSES as readonly string[]).includes(status)) {
    filter.status = status as ReviewDoc["status"];
  }

  const collection = await reviewsCollection();
  const [reviews, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    collection.countDocuments(filter),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Reviews"
        description={`${total} review${total === 1 ? "" : "s"}`}
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Reviews" }]}
      />

      <form method="get" className="flex flex-wrap gap-3">
        <FilterSelect
          name="status"
          defaultValue={status}
          label="All statuses"
          options={STATUSES.map((value) => ({ value, label: value }))}
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Apply
        </button>
      </form>

      {reviews.length === 0 ? (
        <EmptyState title="No reviews match this filter" />
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <ReviewRow
              key={review._id.toString()}
              review={{
                id: review._id.toString(),
                customerName: review.customerName,
                rating: review.rating,
                title: review.title,
                text: review.text,
                images: review.images,
                status: review.status,
                isVerifiedPurchase: review.isVerifiedPurchase,
                adminNote: review.adminNote,
                createdAt: review.createdAt.toISOString(),
              }}
            />
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/admin/reviews" searchParams={{ status }} />
    </div>
  );
}
