'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface DisconnectButtonProps {
  orgId: string;
}

export default function DisconnectButton({ orgId }: DisconnectButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm('Disconnect this Square account? You can reconnect later.')) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/connect/square/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) {
        setError(json.error ?? 'Disconnect failed');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-red-400 hover:text-red-700 disabled:opacity-50"
      >
        {isPending ? 'Disconnecting…' : 'Disconnect'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
