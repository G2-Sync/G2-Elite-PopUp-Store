'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '../../_actions';
import type { OrderStatus } from '@/lib/supabase/types';

interface OrderActionsProps {
  orgId: string;
  orderId: string;
  nextStatuses: OrderStatus[];
  transitionLabels: Partial<Record<OrderStatus, string>>;
}

export default function OrderActions({
  orgId,
  orderId,
  nextStatuses,
  transitionLabels,
}: OrderActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleTransition(status: OrderStatus) {
    const label = transitionLabels[status] ?? status;
    if (status === 'cancelled' || status === 'refunded') {
      if (!confirm(`Are you sure you want to "${label}"? This cannot be undone.`)) return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orgId, orderId, status);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const isDestructive = (s: OrderStatus) => s === 'cancelled' || s === 'refunded';

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {nextStatuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleTransition(s)}
            disabled={isPending}
            className={[
              'rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50',
              isDestructive(s)
                ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                : 'bg-zinc-900 text-white hover:opacity-80',
            ].join(' ')}
          >
            {transitionLabels[s] ?? s}
          </button>
        ))}
      </div>
    </div>
  );
}
