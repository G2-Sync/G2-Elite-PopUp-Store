import Link from 'next/link';
import Image from 'next/image';
import { getOrgContext } from '@/lib/org/context';
import { requireOrgAdmin } from '@/lib/auth/session';
import AdminNav from '@/components/admin/AdminNav';
import LogoutButton from '@/components/LogoutButton';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

/**
 * Admin layout for /[orgSlug]/admin/*
 *
 * - Resolves org (404s on unknown slug)
 * - requireOrgAdmin redirects to /login (no session) or / (not authorized)
 * - Renders sidebar + top bar shell
 */
export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });
  await requireOrgAdmin(org.id);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {org.logo_url ? (
            <Image
              src={org.logo_url}
              alt={`${org.name} logo`}
              width={100}
              height={28}
              className="h-7 w-auto object-contain"
            />
          ) : (
            <span className="text-sm font-extrabold uppercase tracking-widest text-zinc-900">
              {org.name}
            </span>
          )}
          <span className="hidden text-xs text-zinc-400 sm:inline">Admin</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href={`/${orgSlug}/shop`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-xs font-medium text-zinc-500 hover:text-zinc-900 sm:block"
          >
            View Storefront &rarr;
          </Link>
          <LogoutButton className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50" />
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white">
          <AdminNav orgSlug={orgSlug} />
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-zinc-50">
          {children}
        </main>
      </div>
    </div>
  );
}
