'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useOrgCart } from '@/hooks/useOrgCart';

interface CartIconBadgeProps {
  orgSlug: string;
}

export default function CartIconBadge({ orgSlug }: CartIconBadgeProps) {
  const { itemCount } = useOrgCart(orgSlug);

  return (
    <Link
      href={`/${orgSlug}/cart`}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      aria-label={`View cart${itemCount > 0 ? ` (${itemCount} item${itemCount === 1 ? '' : 's'})` : ''}`}
    >
      <ShoppingCart size={20} aria-hidden="true" />
      {itemCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
          aria-hidden="true"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
