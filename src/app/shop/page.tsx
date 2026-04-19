import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Product, Category } from '@/lib/supabase/types';
import ProductGrid from '@/components/ProductGrid';
import FilterBar from '@/components/FilterBar';

export const metadata: Metadata = {
  title: 'Shop — G2 Elite Pop-Up Store',
  description: 'Browse limited-drop apparel, accessories, art prints, and home goods.',
};

// Fallback seed data used when Supabase is not yet reachable
const FALLBACK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Apparel', slug: 'apparel', sort_order: 1, created_at: '' },
  { id: 'cat-2', name: 'Accessories', slug: 'accessories', sort_order: 2, created_at: '' },
  { id: 'cat-3', name: 'Art & Prints', slug: 'art', sort_order: 3, created_at: '' },
  { id: 'cat-4', name: 'Home Goods', slug: 'home', sort_order: 4, created_at: '' },
];

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Classic Logo Tee',
    slug: 'classic-logo-tee',
    description: 'Premium cotton tee with embroidered logo.',
    price_cents: 3500,
    category_id: 'cat-1',
    stock: 25,
    is_active: true,
    created_at: '',
    updated_at: '',
    categories: FALLBACK_CATEGORIES[0],
  },
  {
    id: 'prod-2',
    name: 'Enamel Pin Set',
    slug: 'enamel-pin-set',
    description: 'Set of 3 collectible enamel pins.',
    price_cents: 1500,
    category_id: 'cat-2',
    stock: 50,
    is_active: true,
    created_at: '',
    updated_at: '',
    categories: FALLBACK_CATEGORIES[1],
  },
  {
    id: 'prod-3',
    name: 'Limited Print 01',
    slug: 'limited-print-01',
    description: 'Numbered giclée print, 12x18".',
    price_cents: 4500,
    category_id: 'cat-3',
    stock: 10,
    is_active: true,
    created_at: '',
    updated_at: '',
    categories: FALLBACK_CATEGORIES[2],
  },
  {
    id: 'prod-4',
    name: 'Ceramic Mug',
    slug: 'ceramic-mug',
    description: 'Handmade ceramic mug, 12oz.',
    price_cents: 2200,
    category_id: 'cat-4',
    stock: 30,
    is_active: true,
    created_at: '',
    updated_at: '',
    categories: FALLBACK_CATEGORIES[3],
  },
];

async function getShopData(): Promise<{ products: Product[]; categories: Category[] }> {
  try {
    const supabase = await createClient();

    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from('products')
        .select('*, categories(*), product_images(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true }),
    ]);

    if (productsResult.error || categoriesResult.error) {
      console.error(
        'Supabase query error:',
        productsResult.error ?? categoriesResult.error
      );
      return { products: FALLBACK_PRODUCTS, categories: FALLBACK_CATEGORIES };
    }

    return {
      products: (productsResult.data as Product[]) ?? FALLBACK_PRODUCTS,
      categories: (categoriesResult.data as Category[]) ?? FALLBACK_CATEGORIES,
    };
  } catch (err) {
    console.error('Supabase not reachable, using fallback data:', err);
    return { products: FALLBACK_PRODUCTS, categories: FALLBACK_CATEGORIES };
  }
}

export default async function ShopPage() {
  const { products, categories } = await getShopData();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Shop
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {products.length} {products.length === 1 ? 'item' : 'items'} available
        </p>
      </div>

      <div className="mb-8">
        <FilterBar categories={categories} />
      </div>

      <ProductGrid products={products} />
    </main>
  );
}
