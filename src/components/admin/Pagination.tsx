import Link from "next/link";

/**
 * Link-based pagination (no JS required) that preserves every other query
 * param (search, filters, sort) and only ever changes `page`.
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "page" && value) params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const linkClass = (disabled: boolean) =>
    `rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
      disabled
        ? "pointer-events-none border-gray-200 text-gray-300"
        : "border-gray-200 text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
      <Link href={hrefFor(page - 1)} aria-disabled={page <= 1} className={linkClass(page <= 1)}>
        ← Previous
      </Link>
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </p>
      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= totalPages}
        className={linkClass(page >= totalPages)}
      >
        Next →
      </Link>
    </nav>
  );
}
