import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Super admin layout — /super-admin/*
 *
 * Guards the entire section: redirects to /login if the visitor is not an
 * authenticated super-admin (via requireSuperAdmin).
 */
export default async function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  // This will redirect to /login (no session) or / (not super-admin) if the
  // check fails. The function returns the user on success.
  await requireSuperAdmin();

  // Fetch current user email for the nav display
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            href="/super-admin"
            className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 transition-opacity hover:opacity-70"
          >
            G2 Elite — Super Admin
          </Link>

          {/* Center nav */}
          <nav className="flex items-center gap-6" aria-label="Super admin navigation">
            <Link
              href="/super-admin"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Dashboard
            </Link>
            <Link
              href="/super-admin/organizations"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Organizations
            </Link>
          </nav>

          {/* User + sign out */}
          <div className="flex items-center gap-4">
            {user?.email && (
              <span className="hidden text-xs text-zinc-400 sm:block">
                {user.email}
              </span>
            )}
            <Link
              href="/logout"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
