'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AdminNavProps {
  orgSlug: string;
}

// `exact: true` means the item is only active on an exact path match —
// useful for parent items like /settings whose nested routes have their own
// nav entry (e.g. /settings/payments).
const navItems = [
  { label: 'Dashboard', path: '', exact: true },
  { label: 'Products', path: '/products', exact: false },
  { label: 'Categories', path: '/categories', exact: false },
  { label: 'Orders', path: '/orders', exact: false },
  { label: 'Reports', path: '/reports', exact: false },
  { label: 'Payments', path: '/settings/payments', exact: false },
  { label: 'Settings', path: '/settings', exact: true },
] as const;

export default function AdminNav({ orgSlug }: AdminNavProps) {
  const pathname = usePathname();
  const base = `/${orgSlug}/admin`;

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map(({ label, path, exact }) => {
        const href = `${base}${path}`;
        const isActive =
          path === ''
            ? pathname === base || pathname === `${base}/`
            : exact
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
