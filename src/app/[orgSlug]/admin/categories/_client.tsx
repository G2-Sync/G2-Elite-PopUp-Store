'use client';

import { useState, useTransition } from 'react';
import { createCategory, updateCategory, deleteCategory } from '../_actions';
import type { Category } from '@/lib/supabase/types';

interface CategoriesClientProps {
  orgId: string;
  initialCategories: Category[];
}

export default function CategoriesClient({ orgId, initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createCategory(orgId, newName.trim());
      if (result.ok) {
        // Optimistic: re-fetch is implicit since we get the new id back
        // For simplicity, add a placeholder and let the user refresh for slug
        setCategories((prev) => [
          ...prev,
          {
            id: result.data.id,
            organization_id: orgId,
            name: newName.trim(),
            slug: newName.toLowerCase().replace(/\s+/g, '-'),
            sort_order: prev.length,
            created_at: new Date().toISOString(),
          },
        ]);
        setNewName('');
      } else {
        setError(result.error);
      }
    });
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditingName(cat.name);
  }

  function handleSaveEdit(cat: Category) {
    if (!editingName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await updateCategory(orgId, cat.id, { name: editingName.trim() });
      if (result.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, name: editingName.trim() } : c))
        );
        setEditingId(null);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(cat: Category) {
    if (
      !confirm(
        `Delete "${cat.name}"? Products assigned to this category will become uncategorized.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(orgId, cat.id);
      if (result.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      } else {
        setError(result.error);
      }
    });
  }

  function moveCat(index: number, direction: 'up' | 'down') {
    const newCats = [...categories];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newCats.length) return;

    [newCats[index], newCats[swapIndex]] = [newCats[swapIndex], newCats[index]];
    // Reassign sort_order
    const updated = newCats.map((cat, i) => ({ ...cat, sort_order: i }));
    setCategories(updated);

    // Persist sort_order changes
    startTransition(async () => {
      await Promise.all([
        updateCategory(orgId, updated[index].id, { sort_order: updated[index].sort_order }),
        updateCategory(orgId, updated[swapIndex].id, { sort_order: updated[swapIndex].sort_order }),
      ]);
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {categories.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-zinc-400">No categories yet. Add one below.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr key={cat.id} className={i % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}>
                  {/* Sort order arrows */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveCat(i, 'up')}
                        disabled={isPending || i === 0}
                        className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                        aria-label="Move up"
                      >
                        &#8679;
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCat(i, 'down')}
                        disabled={isPending || i === categories.length - 1}
                        className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                        aria-label="Move down"
                      >
                        &#8681;
                      </button>
                    </div>
                  </td>

                  {/* Name (inline edit) */}
                  <td className="px-4 py-3">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(cat);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                        disabled={isPending}
                      />
                    ) : (
                      <span
                        className="cursor-pointer font-medium text-zinc-900 hover:underline"
                        onClick={() => startEdit(cat)}
                      >
                        {cat.name}
                      </span>
                    )}
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{cat.slug}</td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {editingId === cat.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat)}
                            disabled={isPending}
                            className="text-xs font-medium text-zinc-900 hover:underline disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="text-xs font-medium text-zinc-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            disabled={isPending}
                            className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add new row */}
        <div className="border-t border-zinc-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="New category name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !newName.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
