import { createAdminClient } from '@/lib/supabase/admin';
import LoginForm from './_form';

/**
 * Login page — /login
 *
 * Server component that:
 *  1. Checks whether any super-admin exists (to determine if signup link is shown)
 *  2. Renders a centered card with the client-side LoginForm
 */
export default async function LoginPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from('super_admins')
    .select('user_id', { count: 'exact', head: true });

  const hasSuperAdmin = (count ?? 0) > 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-extrabold uppercase tracking-widest text-zinc-900">
            G2 Elite
          </span>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <LoginForm showSignupLink={!hasSuperAdmin} />
        </div>
      </div>
    </main>
  );
}
