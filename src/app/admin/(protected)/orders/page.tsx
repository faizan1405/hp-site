import type { Filter } from "mongodb";
import { ordersCollection, type OrderDoc } from "@/lib/db/schema";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { SearchInput } from "@/components/admin/SearchInput";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { OrderRow } from "@/components/admin/OrderRow";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING_PAYMENT", "PAID", "PAYMENT_FAILED", "CANCELLED"] as const;
const PAGE_SIZE = 20;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string; page?: string }>;
}) {
  const { status, q, sort, page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const sortOrder = sort === "oldest" ? 1 : -1;

  const filter: Filter<OrderDoc> = {};
  if (status && (STATUSES as readonly string[]).includes(status)) {
    filter.status = status as OrderDoc["status"];
  }
  if (q) {
    const pattern = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { orderNumber: pattern },
      { customerName: pattern },
      { email: pattern },
      { phone: pattern },
    ];
  }

  const collection = await ordersCollection();
  const [orders, total, paidTotal] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    collection.countDocuments(filter),
    collection.countDocuments({ status: "PAID" }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Orders"
        description={`${total} order${total === 1 ? "" : "s"} · ${paidTotal} paid`}
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Orders" }]}
      />

      <form method="get" className="flex flex-wrap gap-3">
        <SearchInput name="q" defaultValue={q} placeholder="Search order #, name, email or phone" />
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

      {orders.length === 0 ? (
        <EmptyState title="No orders match this filter" description="Try clearing the search or status filter." />
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderRow
              key={order._id.toString()}
              order={{
                id: order._id.toString(),
                orderNumber: order.orderNumber,
                productName: order.productName,
                amount: order.amount,
                currency: order.currency,
                status: order.status,
                customerName: order.customerName,
                email: order.email,
                phone: order.phone,
                address: order.address,
                city: order.city,
                state: order.state,
                postalCode: order.postalCode,
                razorpayPaymentId: order.razorpayPaymentId,
                createdAt: order.createdAt.toISOString(),
              }}
            />
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/orders"
        searchParams={{ status, q, sort }}
      />
    </div>
  );
}
