'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AdminNavProps {
  orgSlug: string;
}

const navItems = [
  { label: 'Dashboard', path: '' },
  { label: 'Products', path: '/products' },
  { label: 'Categories', path: '/categories' },
  { label: 'Orders', path: '/orders' },
  { label: 'Reports', path: '/reports' },
  { label: 'Settings', path: '/settings' },
] as const;

export default function AdminNav({ orgSlug }: AdminNavProps) {
  const pathname = usePathname();
  const base = `/${orgSlug}/admin`;

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map(({ label, path }) => {
        const href = `${base}${path}`;
        // Dashboard is active only when exactly on /admin
        const isActive =
          path === ''
            ? pathname === base || pathname === `${base}/`
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
