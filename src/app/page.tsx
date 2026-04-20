import Link from 'next/link';
import { getCurrentUser, isCurrentUserSuperAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Root marketing landing page — /
 *
 * Public, static-feeling, BUT server-rendered so we can show a contextual
 * "Enter Admin" link to logged-in users. Orgs are accessed directly by slug
 * (e.g. /acme) — they are not listed here by design.
 */
export default async function RootPage() {
  const user = await getCurrentUser();

  // Figure out where a logged-in user should go when they click "Enter Admin"
  let adminLink: { href: string; label: string } | null = null;

  if (user) {
    const isSuper = await isCurrentUserSuperAdmin();
    if (isSuper) {
      adminLink = { href: '/super-admin', label: 'Super Admin Portal →' };
    } else {
      // Check for org admin membership and resolve slug
      const admin = createAdminClient();
      const memberRes = await admin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      const memberRow = memberRes.data as { organization_id: string } | null;
      if (memberRow?.organization_id) {
        const orgRes = await admin
          .from('organizations')
          .select('slug')
          .eq('id', memberRow.organization_id)
          .maybeSingle();
        const orgRow = orgRes.data as { slug: string } | null;
        if (orgRow?.slug) {
          adminLink = { href: `/${orgRow.slug}/admin`, label: 'Your Admin Panel →' };
        }
      }
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
          G2 Elite Pop-Up Store Platform
        </h1>

        <p className="mt-4 text-lg text-zinc-500 sm:text-xl">
          Host curated pop-up shops for your brand.
        </p>

        {/* Primary CTA changes based on auth state */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {adminLink ? (
            <Link
              href={adminLink.href}
              className="inline-flex items-center rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80"
            >
              {adminLink.label}
            </Link>
          ) : (
            <a
              href="mailto:admin@g2sync.com"
              className="inline-flex items-center rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80"
            >
              Run a pop-up? Contact us
            </a>
          )}
        </div>

        {/* Subtle secondary link */}
        <div className="mt-6 text-xs text-zinc-400">
          {user ? (
            <>
              Signed in as {user.email}
              {' · '}
              <Link href="/logout" className="hover:text-zinc-700 underline-offset-2 hover:underline">
                Sign out
              </Link>
            </>
          ) : (
            <Link href="/login" className="hover:text-zinc-700 underline-offset-2 hover:underline">
              Admin sign in →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
