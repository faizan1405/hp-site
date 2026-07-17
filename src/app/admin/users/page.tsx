import type { Document, Filter } from "mongodb";
import { auth } from "@/lib/auth";
import { usersCollection, type UserDoc } from "@/lib/db/schema";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { SearchInput } from "@/components/admin/SearchInput";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { DataTable } from "@/components/admin/DataTable";
import { UserRow } from "@/components/admin/UserRow";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type UserWithCounts = UserDoc & { reviewCount: number; enquiryCount: number };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
}) {
  const { q, role, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const session = await auth();

  const filter: Filter<UserDoc> = {};
  if (q) {
    const pattern = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  if (role === "ADMIN" || role === "USER") filter.role = role;
  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  const collection = await usersCollection();
  const total = await collection.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const users = await collection
    .aggregate<UserWithCounts>([
      { $match: filter as Document },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * PAGE_SIZE },
      { $limit: PAGE_SIZE },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "userId",
          as: "reviews",
        },
      },
      {
        $lookup: {
          from: "contactEnquiries",
          localField: "_id",
          foreignField: "userId",
          as: "enquiries",
        },
      },
      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
          enquiryCount: { $size: "$enquiries" },
        },
      },
      { $project: { reviews: 0, enquiries: 0 } },
    ])
    .toArray();

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Users"
        description={`${total} registered user${total === 1 ? "" : "s"}`}
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
      />

      <form method="get" className="flex flex-wrap gap-3">
        <SearchInput name="q" defaultValue={q} placeholder="Search name or email" />
        <FilterSelect
          name="role"
          defaultValue={role}
          label="All roles"
          options={[
            { value: "ADMIN", label: "Admin" },
            { value: "USER", label: "User" },
          ]}
        />
        <FilterSelect
          name="status"
          defaultValue={status}
          label="All statuses"
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Apply
        </button>
      </form>

      {users.length === 0 ? (
        <EmptyState title="No users match this search" />
      ) : (
        <DataTable
          head={
            <>
              <th scope="col" className="px-4 py-3">User</th>
              <th scope="col" className="px-4 py-3">Role</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Joined</th>
              <th scope="col" className="px-4 py-3">Last login</th>
              <th scope="col" className="px-4 py-3">Reviews</th>
              <th scope="col" className="px-4 py-3">Enquiries</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </>
          }
        >
          {users.map((user) => (
            <UserRow
              key={user._id.toString()}
              isSelf={session?.user.id === user._id.toString()}
              user={{
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt.toISOString(),
                lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
                reviewCount: user.reviewCount,
                enquiryCount: user.enquiryCount,
              }}
            />
          ))}
        </DataTable>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/admin/users" searchParams={{ q, role, status }} />
    </div>
  );
}
