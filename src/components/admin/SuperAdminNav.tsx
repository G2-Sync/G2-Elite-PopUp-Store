'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/super-admin', exact: true },
  { label: 'Organizations', href: '/super-admin/organizations', exact: false },
] as const;

export default function SuperAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Super admin navigation">
      {navItems.map(({ label, href, exact }) => {
        const isActive = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
