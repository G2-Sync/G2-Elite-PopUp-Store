import Link from 'next/link';
import Image from 'next/image';
import { getOrgContext } from '@/lib/org/context';
import OrgThemeProvider from '@/components/OrgThemeProvider';
import CartIconBadge from '@/components/CartIconBadge';
import { isCurrentUserOrgAdmin, isCurrentUserSuperAdmin } from '@/lib/auth/session';

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

  // Show a subtle "Admin" link in the storefront nav if the current user
  // has admin access to THIS org (super-admins count as admins everywhere).
  // For super-admins, the link returns to the super-admin's edit-org page,
  // which is the natural hub they came from ("View Storefront" button).
  // For regular org admins, it returns to their org's admin dashboard.
  const [showAdminLink, isSuper] = await Promise.all([
    isCurrentUserOrgAdmin(org.id),
    isCurrentUserSuperAdmin(),
  ]);
  const adminLinkHref = isSuper
    ? `/super-admin/organizations/${org.id}`
    : `/${orgSlug}/admin`;
  const adminLinkLabel = isSuper ? '← Super Admin' : '← Admin';

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

            {/* Cart icon with live item count badge */}
            <CartIconBadge orgSlug={orgSlug} />

            {/* Admin shortcut — only visible to org admins / super-admins.
                Super-admins return to the org's edit page (their hub);
                regular org admins return to /{slug}/admin. */}
            {showAdminLink && (
              <Link
                href={adminLinkHref}
                className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                title={
                  isSuper
                    ? 'Return to super-admin'
                    : 'Return to admin dashboard'
                }
              >
                {adminLinkLabel}
              </Link>
            )}
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
