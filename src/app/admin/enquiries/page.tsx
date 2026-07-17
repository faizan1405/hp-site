import type { Filter } from "mongodb";
import { contactEnquiriesCollection, type ContactEnquiryDoc } from "@/lib/db/schema";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { SearchInput } from "@/components/admin/SearchInput";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { EnquiryRow } from "@/components/admin/EnquiryRow";

export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"] as const;
const PAGE_SIZE = 20;

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string; page?: string }>;
}) {
  const { status, q, sort, page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const sortOrder = sort === "oldest" ? 1 : -1;

  const filter: Filter<ContactEnquiryDoc> = {};
  if (status && (STATUSES as readonly string[]).includes(status)) {
    filter.status = status as ContactEnquiryDoc["status"];
  }
  if (q) {
    const pattern = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { message: pattern }];
  }

  const collection = await contactEnquiriesCollection();
  const [enquiries, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    collection.countDocuments(filter),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Enquiries"
        description={`${total} contact enquir${total === 1 ? "y" : "ies"}`}
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Enquiries" }]}
      />

      <form method="get" className="flex flex-wrap gap-3">
        <SearchInput name="q" defaultValue={q} placeholder="Search name, email or message" />
        <FilterSelect
          name="status"
          defaultValue={status}
          label="All statuses"
          options={STATUSES.map((value) => ({ value, label: value.replace("_", " ") }))}
        />
        <FilterSelect
          name="sort"
          defaultValue={sort}
          label="Newest first"
          options={[{ value: "oldest", label: "Oldest first" }]}
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Apply
        </button>
      </form>

      {enquiries.length === 0 ? (
        <EmptyState title="No enquiries match this filter" description="Try clearing the search or status filter." />
      ) : (
        <ul className="flex flex-col gap-3">
          {enquiries.map((enquiry) => (
            <EnquiryRow
              key={enquiry._id.toString()}
              enquiry={{
                id: enquiry._id.toString(),
                name: enquiry.name,
                email: enquiry.email,
                phone: enquiry.phone,
                subject: enquiry.subject,
                message: enquiry.message,
                status: enquiry.status,
                adminNote: enquiry.adminNote,
                source: enquiry.source,
                createdAt: enquiry.createdAt.toISOString(),
                hasAccount: Boolean(enquiry.userId),
              }}
            />
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/enquiries"
        searchParams={{ status, q, sort }}
      />
    </div>
  );
}
