'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOrder } from '../_actions';

interface DeleteOrderButtonProps {
  orgId: string;
  orderId: string;
  orderNumber: string;
}

/**
 * Delete button for an order row.
 * Shows a confirmation prompt before deleting since this is permanent
 * (cascades to order_items). Useful for cleaning out test orders.
 */
export default function DeleteOrderButton({
  orgId,
  orderId,
  orderNumber,
}: DeleteOrderButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Permanently delete order ${orderNumber}?\n\nThis cannot be undone. The order and its line items will be removed.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteOrder(orgId, orderId);
      if (!result.ok) {
        alert(`Delete failed: ${result.error}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
      title="Permanently delete this order"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
