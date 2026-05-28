import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import ResetPasswordForm from './_form';

/**
 * Set / reset password page — /reset-password
 *
 * Users land here after clicking an invite or password-reset email link
 * (which first passes through /auth/callback to establish a recovery
 * session). They set a new password and get routed to their admin area.
 *
 * If there's no session (expired or invalid link), we show a friendly
 * message + link to request a new one.
 */
interface ResetPasswordPageProps {
  searchParams: Promise<{ dest?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const user = await getCurrentUser();
  const { dest } = await searchParams;
  // Only accept same-site relative paths as a destination (security).
  const safeDest =
    dest && dest.startsWith('/') && !dest.startsWith('//') ? dest : null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold tracking-tight text-zinc-900">
          Set your password
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Choose a password to finish setting up your account.
        </p>

        {user ? (
          <ResetPasswordForm email={user.email ?? ''} dest={safeDest} />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This link has expired or is invalid. Ask your administrator to
              re-send the invite.
            </div>
            <Link
              href="/login"
              className="block text-center text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
            >
              Go to sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
