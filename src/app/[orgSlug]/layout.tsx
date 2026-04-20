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
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
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
              <span
                className="text-sm font-extrabold uppercase tracking-widest"
                style={{ color: 'var(--org-primary)' }}
              >
                {org.name}
              </span>
            )}
          </Link>

          {/* Nav actions */}
          <nav className="flex items-center gap-6" aria-label="Store navigation">
            <Link
              href={`/${orgSlug}/shop`}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Shop
            </Link>

            {/* Cart stub — wired up in Phase 3 */}
            <Link
              href={`/${orgSlug}/cart`}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
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
      <footer
        className="py-10"
        style={{ backgroundColor: 'var(--org-primary)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-white">{org.name}</p>
          {org.tagline && (
            <p className="mt-1 text-xs text-white/70">{org.tagline}</p>
          )}
          <p className="mt-4 text-xs text-white/50">
            &copy; {new Date().getFullYear()} {org.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </OrgThemeProvider>
  );
}
