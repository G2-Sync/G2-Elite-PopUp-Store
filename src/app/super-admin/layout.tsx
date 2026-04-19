import Link from 'next/link';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Super admin layout — wraps all /super-admin/* pages.
 *
 * Phase 1 placeholder — no auth guard yet. Phase 2 adds middleware-based
 * protection that checks the super_admins table.
 */
export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <div className="flex min-h-full flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
            Super Admin
          </span>

          <nav className="flex items-center gap-6" aria-label="Super admin navigation">
            <Link
              href="/super-admin/organizations"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Organizations
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
