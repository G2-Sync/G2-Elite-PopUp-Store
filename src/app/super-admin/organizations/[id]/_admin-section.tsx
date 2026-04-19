'use client';

import { useState, useTransition } from 'react';
import { inviteOrgAdmin, resendInvite, removeOrgAdmin } from '../_actions';

interface AdminSectionProps {
  orgId: string;
  adminUserId: string | null;
  adminEmail: string | null;
}

export default function AdminSection({ orgId, adminUserId, adminEmail }: AdminSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localAdminEmail, setLocalAdminEmail] = useState<string | null>(adminEmail);
  const [localAdminUserId, setLocalAdminUserId] = useState<string | null>(adminUserId);
  const [inviteEmail, setInviteEmail] = useState('');

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const email = inviteEmail.trim();
    if (!email) return;
    startTransition(async () => {
      const result = await inviteOrgAdmin(orgId, email);
      if (result.ok) {
        setSuccess(`Invite sent to ${email}.`);
        setLocalAdminEmail(email);
        // We don't know the new userId here — the page will show re-send/remove after refresh
      } else {
        setError(result.error);
      }
    });
  }

  function handleResend() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await resendInvite(orgId);
      if (result.ok) {
        setSuccess('Invite resent.');
      } else {
        setError(result.error);
      }
    });
  }

  function handleRemove() {
    if (!localAdminUserId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await removeOrgAdmin(orgId, localAdminUserId);
      if (result.ok) {
        setLocalAdminEmail(null);
        setLocalAdminUserId(null);
        setSuccess('Admin removed.');
        setInviteEmail('');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {localAdminEmail ? (
        // Admin is assigned
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700">Current admin</p>
            <p className="mt-0.5 text-sm text-zinc-900">{localAdminEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={isPending}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
            >
              {isPending ? 'Working…' : 'Re-send invite'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
            >
              Remove admin
            </button>
          </div>
        </div>
      ) : (
        // No admin assigned — show invite form
        <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !inviteEmail.trim()}
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isPending ? 'Sending…' : 'Invite admin'}
          </button>
        </form>
      )}
    </div>
  );
}
