export function FilterSelect({
  name,
  defaultValue,
  label,
  options,
}: {
  name: string;
  defaultValue?: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      aria-label={label}
      className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 focus:border-glacier-500 focus:outline-none"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
