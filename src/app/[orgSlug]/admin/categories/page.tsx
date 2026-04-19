import { getOrgContext } from '@/lib/org/context';
import { createClient } from '@/lib/supabase/server';
import CategoriesClient from './_client';
import type { Category } from '@/lib/supabase/types';

interface CategoriesPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, sort_order, created_at, organization_id')
    .eq('organization_id', org.id)
    .order('sort_order', { ascending: true });

  const categories = (data ?? []) as Category[];

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Categories</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Organize your products. Drag rows or use arrows to reorder.
        </p>
      </div>

      <CategoriesClient orgId={org.id} initialCategories={categories} />
    </div>
  );
}
