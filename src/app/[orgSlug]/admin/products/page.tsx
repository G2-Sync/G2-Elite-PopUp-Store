import Link from 'next/link';
import Image from 'next/image';
import { getOrgContext } from '@/lib/org/context';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import { toggleProductActive, deleteProduct } from '../_actions';
import type { Product, ProductImage, Category } from '@/lib/supabase/types';

interface ProductsPageProps {
  params: Promise<{ orgSlug: string }>;
}

type ProductRow = Product & { product_images: ProductImage[]; categories: Category | null };

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });
  const supabase = await createClient();

  const { data } = await supabase
    .from('products')
    .select('*, product_images(*), categories(*)')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  const products = (data ?? []) as ProductRow[];

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Products</h1>
        <Link
          href={`/${orgSlug}/admin/products/new`}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80"
        >
          + New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-24 text-center">
          <p className="text-zinc-500">No products yet.</p>
          <Link
            href={`/${orgSlug}/admin/products/new`}
            className="mt-4 text-sm font-medium text-zinc-900 underline underline-offset-2"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-3 w-16">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, i) => {
                const primaryImg =
                  product.product_images.find((img) => img.is_primary) ??
                  product.product_images[0];

                return (
                  <tr
                    key={product.id}
                    className={i % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}
                  >
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="h-10 w-10 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
                        {primaryImg ? (
                          <Image
                            src={primaryImg.url}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-300">
                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-medium text-zinc-900">{product.name}</td>

                    {/* Category */}
                    <td className="px-4 py-3 text-zinc-500">
                      {product.categories?.name ?? <span className="text-zinc-300">—</span>}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-zinc-700">
                      {formatPrice(product.price_cents)}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 text-zinc-700">{product.stock}</td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={
                          product.is_active
                            ? 'inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                            : 'inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500'
                        }
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(product.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/${orgSlug}/admin/products/${product.id}`}
                          className="text-xs font-medium text-zinc-700 hover:underline"
                        >
                          Edit
                        </Link>

                        {/* Toggle active */}
                        <form
                          action={async () => {
                            'use server';
                            await toggleProductActive(org.id, product.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
                          >
                            {product.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </form>

                        {/* Delete */}
                        <form
                          action={async () => {
                            'use server';
                            await deleteProduct(org.id, product.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs font-medium text-red-500 hover:text-red-700"
                            onClick={undefined}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
