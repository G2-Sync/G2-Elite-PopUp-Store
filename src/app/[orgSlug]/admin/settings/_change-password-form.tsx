'use client';

import { useState, useTransition } from 'react';
import { changePasswordAction } from './_change-password-action';

const inputCls =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50';

export default function ChangePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await changePasswordAction(password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess('Password updated.');
      setPassword('');
      setConfirm('');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className="text-sm font-medium text-zinc-700">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className={inputCls}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium text-zinc-700">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter password"
          className={inputCls}
          disabled={isPending}
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isPending ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  );
}
