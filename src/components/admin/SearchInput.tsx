export function SearchInput({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      aria-label={placeholder}
      className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-glacier-500 focus:outline-none"
    />
  );
}
