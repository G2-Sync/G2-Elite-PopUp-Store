'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { signupAction } from './_actions';

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signupAction(formData);
      if (result.ok) {
        setSuccess(result.message);
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
        <p className="font-medium">Account created</p>
        <p className="mt-1">{success}</p>
        <p className="mt-3">
          <Link href="/login" className="font-medium text-green-900 underline underline-offset-2">
            Back to sign in
          </Link>
        </p>
      </div>
    );
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
          autoComplete="new-password"
          required
          placeholder="Min. 8 characters"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-medium text-zinc-700">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
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
        {isPending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-zinc-900 underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}
