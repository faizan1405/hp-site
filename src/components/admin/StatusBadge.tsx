export type BadgeTone = "blue" | "amber" | "green" | "red" | "gray" | "indigo";

const toneClasses: Record<BadgeTone, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  green: "border-green-200 bg-green-50 text-green-700",
  red: "border-red-200 bg-red-50 text-red-700",
  gray: "border-gray-200 bg-gray-100 text-gray-600",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide uppercase ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
