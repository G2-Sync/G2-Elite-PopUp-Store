import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { getOrgContext } from '@/lib/org/context';
import OrgThemeProvider from '@/components/OrgThemeProvider';

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

/**
 * Layout for all per-org pages (/[orgSlug]/*).
 *
 * - Fetches the org (404s if not found or inactive)
 * - Injects per-org CSS variables via OrgThemeProvider
 * - Renders org-branded top nav and footer
 */
export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });

  return (
    <OrgThemeProvider org={org}>
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Org identity */}
          <Link
            href={`/${orgSlug}`}
            className="flex items-center gap-2 transition-opacity hover:opacity-70"
            aria-label={`${org.name} home`}
          >
            {org.logo_url ? (
              <Image
                src={org.logo_url}
                alt={`${org.name} logo`}
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                {org.name}
              </span>
            )}
          </Link>

          {/* Nav actions */}
          <nav className="flex items-center gap-6" aria-label="Store navigation">
            <Link
              href={`/${orgSlug}/shop`}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Shop
            </Link>

            {/* Cart stub — wired up in Phase 3 */}
            <Link
              href={`/${orgSlug}/cart`}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="View cart"
            >
              <ShoppingCart size={20} aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <div className="flex flex-1 flex-col">{children}</div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
            &copy; {new Date().getFullYear()} {org.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </OrgThemeProvider>
  );
}
