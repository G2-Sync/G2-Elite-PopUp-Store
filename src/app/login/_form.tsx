'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { loginAction } from './_actions';

interface LoginFormProps {
  showSignupLink: boolean;
}

export default function LoginForm({ showSignupLink }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(formData);
      // If ok:true, the server action redirected — result won't be returned here.
      // If ok:false, display the error.
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          disabled={isPending}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>

      {showSignupLink && (
        <p className="text-center text-xs text-zinc-500">
          First time here?{' '}
          <Link href="/signup" className="font-medium text-zinc-900 underline underline-offset-2">
            Create an account
          </Link>
        </p>
      )}
    </form>
  );
}
