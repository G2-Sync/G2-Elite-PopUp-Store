'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/supabase/types';

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

interface FilterBarProps {
  categories: Category[];
  onCategoryChange?: (slug: string | null) => void;
  onSortChange?: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function FilterBar({
  categories,
  onCategoryChange,
  onSortChange,
}: FilterBarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<SortOption>('newest');

  function handleCategoryClick(slug: string | null) {
    setSelectedCategory(slug);
    onCategoryChange?.(slug);
  }

  function handleSortChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as SortOption;
    setSelectedSort(value);
    onSortChange?.(value);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Category Chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <button
          onClick={() => handleCategoryClick(null)}
          className={cn(
            'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            selectedCategory === null
              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
              : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500'
          )}
          aria-pressed={selectedCategory === null}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              selectedCategory === category.slug
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500'
            )}
            aria-pressed={selectedCategory === category.slug}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <label
          htmlFor="sort-select"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
        >
          Sort:
        </label>
        <select
          id="sort-select"
          value={selectedSort}
          onChange={handleSortChange}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm transition-colors hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:ring-zinc-100"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
