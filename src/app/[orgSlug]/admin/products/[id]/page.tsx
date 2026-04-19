import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrgContext } from '@/lib/org/context';
import { createClient } from '@/lib/supabase/server';
import EditProductForm from './_form';
import type { Category, Product, ProductImage } from '@/lib/supabase/types';

interface EditProductPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

type ProductWithRelations = Product & {
  product_images: ProductImage[];
  categories: Category | null;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { orgSlug, id } = await params;
  const org = await getOrgContext({ orgSlug });
  const supabase = await createClient();

  const [productRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, product_images(*), categories(*)')
      .eq('id', id)
      .eq('organization_id', org.id)
      .single(),

    supabase
      .from('categories')
      .select('id, name, slug, sort_order')
      .eq('organization_id', org.id)
      .order('sort_order', { ascending: true }),
  ]);

  if (productRes.error || !productRes.data) {
    notFound();
  }

  const product = productRes.data as unknown as ProductWithRelations;
  const categories = (categoriesRes.data ?? []) as Category[];

  return (
    <div className="px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href={`/${orgSlug}/admin/products`} className="hover:text-zinc-900">
          Products
        </Link>
        <span>/</span>
        <span className="text-zinc-900">{product.name}</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">Edit Product</h1>

      <div className="max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <EditProductForm
          orgId={org.id}
          orgSlug={orgSlug}
          product={product}
          categories={categories}
        />
      </div>
    </div>
  );
}
