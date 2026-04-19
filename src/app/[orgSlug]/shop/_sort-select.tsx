'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface SortSelectProps {
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

/**
 * Client-side sort dropdown.
 *
 * Updates the `sort` URL search param on change, preserving all other
 * params (e.g. `category`). Uses router.replace so it doesn't push a new
 * history entry for every sort change.
 */
export default function SortSelect({ value, options }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set('sort', e.target.value);
    } else {
      params.delete('sort');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      name="sort"
      value={value}
      onChange={handleChange}
      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
