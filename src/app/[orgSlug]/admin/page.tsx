import Link from 'next/link';
import { getOrgContext } from '@/lib/org/context';

interface AdminPageProps {
  params: Promise<{ orgSlug: string }>;
}

/**
 * Org admin dashboard — /[orgSlug]/admin
 *
 * Phase 1 placeholder — links to sub-sections that will be built in subsequent
 * phases. No auth guard yet; Phase 4 adds middleware-based protection.
 */
export default async function AdminPage({ params }: AdminPageProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });

  const sections = [
    { label: 'Products', href: `/${orgSlug}/admin/products`, description: 'Manage your product catalog' },
    { label: 'Categories', href: `/${orgSlug}/admin/categories`, description: 'Organise products by category' },
    { label: 'Orders', href: `/${orgSlug}/admin/orders`, description: 'View and manage orders' },
    { label: 'Settings', href: `/${orgSlug}/admin/settings`, description: 'Branding, payments, and more' },
  ] as const;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {org.name} Admin
      </h1>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        Manage your pop-up store.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-sm font-semibold text-zinc-900 group-hover:underline dark:text-zinc-50">
              {section.label}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {section.description}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
