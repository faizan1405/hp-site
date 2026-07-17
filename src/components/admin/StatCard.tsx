import Link from "next/link";

export function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </>
  );

  const className =
    "rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors" +
    (href ? " hover:border-glacier-500/50" : "");

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
