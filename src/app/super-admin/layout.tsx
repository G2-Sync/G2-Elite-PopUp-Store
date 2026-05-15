import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';
import SuperAdminNav from '@/components/admin/SuperAdminNav';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Super admin layout — /super-admin/*
 *
 * Guards the entire section: redirects to /login if the visitor is not an
 * authenticated super-admin (via requireSuperAdmin). Renders a slim top bar
 * with brand + user controls plus a left sidebar with section navigation.
 */
export default async function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  await requireSuperAdmin();

  // Fetch current user email for the top bar display
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-col">
      {/* Slim top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <Link
            href="/super-admin"
            className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 transition-opacity hover:opacity-70"
          >
            G2 Elite — Super Admin
          </Link>

          {/* User + sign out */}
          <div className="flex items-center gap-4">
            {user?.email && (
              <span className="hidden text-xs text-zinc-400 sm:block">{user.email}</span>
            )}
            <LogoutButton className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50" />
          </div>
        </div>
      </header>

      {/* Main layout: sidebar + content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white">
          <SuperAdminNav />
        </aside>

        {/* Content */}
        <div className="flex flex-1 flex-col bg-zinc-50">{children}</div>
      </div>
    </div>
  );
}
