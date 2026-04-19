'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { slugify } from '@/lib/utils';
import { createProduct } from '../../_actions';
import type { Category } from '@/lib/supabase/types';

interface ProductFormProps {
  orgId: string;
  orgSlug: string;
  categories: Category[];
}

export default function ProductForm({ orgId, orgSlug, categories }: ProductFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [slugOverride, setSlugOverride] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const computedSlug = slugEdited ? slugOverride : slugify(name);

  function handleNameChange(val: string) {
    setName(val);
    if (!slugEdited) setSlugOverride(slugify(val));
  }

  function handleSlugChange(val: string) {
    setSlugEdited(true);
    setSlugOverride(val);
  }

  function processFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter(
      (f) => f.size <= 8 * 1024 * 1024 && ['image/png', 'image/jpeg', 'image/webp'].includes(f.type)
    );
    setSelectedFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    // Inject computed slug and active state
    formData.set('slug', computedSlug);
    formData.set('is_active', isActive ? 'true' : 'false');
    // Re-attach files (formData from the form already has them via the input)
    startTransition(async () => {
      const result = await createProduct(orgId, formData);
      if (!result.ok) setError(result.error);
      // On success, server action redirects
    });
  }

  const inputCls =
    'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-zinc-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Classic Logo Tee"
          className={inputCls}
          disabled={isPending}
        />
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="slug" className="text-sm font-medium text-zinc-700">
          URL slug
        </label>
        <div className="flex items-center rounded-md border border-zinc-300 bg-white focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200">
          <span className="border-r border-zinc-200 px-3 py-2 text-xs text-zinc-400 select-none">
            /{orgSlug}/product/
          </span>
          <input
            id="slug"
            name="slug"
            type="text"
            value={computedSlug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none disabled:opacity-50"
            disabled={isPending}
          />
        </div>
        <p className="text-xs text-zinc-400">Auto-generated from name — edit to override</p>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-zinc-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Describe the product…"
          className={inputCls}
          disabled={isPending}
        />
      </div>

      {/* Price + Stock row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="price" className="text-sm font-medium text-zinc-700">
            Price ($) <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="29.99"
            className={inputCls}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="stock" className="text-sm font-medium text-zinc-700">
            Stock <span className="text-red-500">*</span>
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            required
            min="0"
            step="1"
            placeholder="100"
            className={inputCls}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category_id" className="text-sm font-medium text-zinc-700">
          Category
        </label>
        <select
          id="category_id"
          name="category_id"
          className={inputCls}
          disabled={isPending}
        >
          <option value="">Uncategorized</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Active toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700">Visibility</label>
        <input type="hidden" name="is_active" value={isActive ? 'true' : 'false'} />
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
            disabled={isPending}
          />
          <span className="text-sm text-zinc-700">Active (visible in storefront)</span>
        </label>
      </div>

      {/* Images */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700">Images</label>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isPending && fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && !isPending && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            processFiles(e.dataTransfer.files);
          }}
          className={[
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
            isDragging ? 'border-zinc-500 bg-zinc-50' : 'border-zinc-300 bg-white hover:border-zinc-400',
            isPending ? 'pointer-events-none opacity-50' : '',
          ].join(' ')}
        >
          <p className="text-sm text-zinc-500">
            Drag images here, or <span className="font-medium text-zinc-900 underline">click to browse</span>
          </p>
          <p className="mt-1 text-xs text-zinc-400">PNG, JPG, WEBP — up to 8 MB each</p>
          <input
            ref={fileInputRef}
            type="file"
            name="images"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => processFiles(e.target.files)}
            disabled={isPending}
          />
        </div>

        {previews.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" unoptimized />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-zinc-900/70 px-1 py-0.5 text-[10px] text-white">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-zinc-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isPending ? 'Creating…' : 'Create product'}
        </button>
        <a
          href={`/${orgSlug}/admin/products`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
