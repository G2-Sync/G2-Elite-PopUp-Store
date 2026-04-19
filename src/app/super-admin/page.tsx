import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Super admin dashboard — /super-admin
 *
 * Displays aggregate stats and quick-action links. Auth guard is in the parent
 * layout (requireSuperAdmin runs there).
 */
export default async function SuperAdminPage() {
  const admin = createAdminClient();

  // Total org count
  const { count: totalOrgs } = await admin
    .from('organizations')
    .select('id', { count: 'exact', head: true });

  // Active org count
  const { count: activeOrgs } = await admin
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  // Orgs WITH an admin member (distinct organization_id values)
  const { data: orgsWithAdmin } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('role', 'admin');

  const orgsWithAdminSet = new Set((orgsWithAdmin ?? []).map((r) => r.organization_id));
  const orgsWithoutAdmin = (totalOrgs ?? 0) - orgsWithAdminSet.size;

  const stats = [
    { label: 'Total organizations', value: totalOrgs ?? 0 },
    { label: 'Active organizations', value: activeOrgs ?? 0 },
    { label: 'Organizations without an admin', value: orgsWithoutAdmin },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Platform overview</p>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <p className="text-3xl font-bold text-zinc-900">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/super-admin/organizations"
          className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-shadow hover:shadow-md"
        >
          View all organizations
        </Link>
        <Link
          href="/super-admin/organizations/new"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-80"
        >
          + New organization
        </Link>
      </div>
    </main>
  );
}
