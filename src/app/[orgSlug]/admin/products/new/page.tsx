import Link from 'next/link';
import { getOrgContext } from '@/lib/org/context';
import { createClient } from '@/lib/supabase/server';
import ProductForm from './_form';
import type { Category } from '@/lib/supabase/types';

interface NewProductPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, sort_order')
    .eq('organization_id', org.id)
    .order('sort_order', { ascending: true });

  const categories = (data ?? []) as Category[];

  return (
    <div className="px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href={`/${orgSlug}/admin/products`} className="hover:text-zinc-900">
          Products
        </Link>
        <span>/</span>
        <span className="text-zinc-900">New</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">New Product</h1>

      <div className="max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <ProductForm orgId={org.id} orgSlug={orgSlug} categories={categories} />
      </div>
    </div>
  );
}
