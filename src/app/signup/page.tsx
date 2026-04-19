import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import SignupForm from './_form';

/**
 * Bootstrap signup page — /signup
 *
 * Accessible ONLY when the super_admins table is empty (i.e., no super-admin
 * has been provisioned yet). Once any super-admin exists the page redirects to
 * /login. This prevents public registrations after the platform is live.
 */
export default async function SignupPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from('super_admins')
    .select('user_id', { count: 'exact', head: true });

  if ((count ?? 0) > 0) {
    redirect('/login?notice=signup-disabled');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-extrabold uppercase tracking-widest text-zinc-900">
            G2 Elite
          </span>
          <p className="mt-1 text-sm text-zinc-500">Create your admin account</p>
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
            Bootstrap mode — available until a super-admin is assigned
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
