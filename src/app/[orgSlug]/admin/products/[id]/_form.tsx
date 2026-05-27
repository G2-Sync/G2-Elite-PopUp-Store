'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/utils';
import {
  updateProduct,
  deleteProduct,
  removeProductImage,
  setPrimaryImage,
} from '../../_actions';
import type { Category, Product, ProductImage } from '@/lib/supabase/types';

interface EditProductFormProps {
  orgId: string;
  orgSlug: string;
  product: Product & { product_images: ProductImage[]; categories: Category | null };
  categories: Category[];
}

export default function EditProductForm({
  orgId,
  orgSlug,
  product,
  categories,
}: EditProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<ProductImage[]>(product.product_images ?? []);
  const [isActive, setIsActive] = useState(product.is_active);
  const [hasSizes, setHasSizes] = useState(product.has_sizes);
  const [name, setName] = useState(product.name);
  const [slugVal, setSlugVal] = useState(product.slug);
  const [slugEdited, setSlugEdited] = useState(true); // pre-filled, so treat as edited
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleNameChange(val: string) {
    setName(val);
    if (!slugEdited) setSlugVal(slugify(val));
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    formData.set('slug', slugVal);
    formData.set('is_active', isActive ? 'true' : 'false');
    formData.set('has_sizes', hasSizes ? 'true' : 'false');
    startTransition(async () => {
      const result = await updateProduct(orgId, product.id, formData);
      if (result.ok) {
        setSuccess('Product saved.');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirm('Delete this product and all its images? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteProduct(orgId, product.id);
      if (result.ok) {
        router.push(`/${orgSlug}/admin/products`);
      } else {
        setError(result.error);
      }
    });
  }

  function handleRemoveImage(imageId: string) {
    startTransition(async () => {
      const result = await removeProductImage(orgId, product.id, imageId);
      if (result.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      } else {
        setError(result.error);
      }
    });
  }

  function handleSetPrimary(imageId: string) {
    startTransition(async () => {
      const result = await setPrimaryImage(orgId, product.id, imageId);
      if (result.ok) {
        setImages((prev) =>
          prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
        );
      } else {
        setError(result.error);
      }
    });
  }

  function processFiles(fileList: FileList | null) {
    // Files will be included in form submission via the input[name=images]
    if (!fileList) return;
    // Just show count as feedback; real upload happens on save
  }

  const inputCls =
    'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50';

  return (
    <form onSubmit={handleSave} className="space-y-6" noValidate>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
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
            value={slugVal}
            onChange={(e) => { setSlugEdited(true); setSlugVal(e.target.value); }}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none disabled:opacity-50"
            disabled={isPending}
          />
        </div>
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
          defaultValue={product.description ?? ''}
          className={inputCls}
          disabled={isPending}
        />
      </div>

      {/* Price + Stock */}
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
            defaultValue={(product.price_cents / 100).toFixed(2)}
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
            defaultValue={product.stock}
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
          defaultValue={product.category_id ?? ''}
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

      {/* Active */}
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

      {/* Has sizes toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700">Sizes</label>
        <input type="hidden" name="has_sizes" value={hasSizes ? 'true' : 'false'} />
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={hasSizes}
            onChange={(e) => setHasSizes(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
            disabled={isPending}
          />
          <span className="text-sm text-zinc-700">
            This product has sizes (Small, Medium, Large, X-Large, XX-Large, XXX-Large)
          </span>
        </label>
      </div>

      {/* Existing images */}
      {images.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-700">Current images</p>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-50"
              >
                <Image src={img.url} alt="Product image" fill className="object-cover" />
                {img.is_primary && (
                  <span className="absolute left-1 top-1 rounded bg-zinc-900/70 px-1 py-0.5 text-[10px] text-white">
                    Primary
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between bg-zinc-900/60 px-1 py-0.5">
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
                      disabled={isPending}
                      className="text-[10px] text-white hover:underline disabled:opacity-50"
                    >
                      Set primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    disabled={isPending}
                    className="ml-auto text-[10px] text-red-300 hover:text-red-200 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload more images */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700">Add more images</label>
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
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-6 text-center transition-colors',
            isDragging ? 'border-zinc-500 bg-zinc-50' : 'border-zinc-300 bg-white hover:border-zinc-400',
            isPending ? 'pointer-events-none opacity-50' : '',
          ].join(' ')}
        >
          <p className="text-sm text-zinc-500">
            Drag images here or <span className="font-medium text-zinc-900 underline">browse</span>
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
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
          <a
            href={`/${orgSlug}/admin/products`}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            Back
          </a>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          Delete product
        </button>
      </div>
    </form>
  );
}
