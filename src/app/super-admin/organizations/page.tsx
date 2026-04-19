import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Organization, OrganizationMember } from '@/lib/supabase/types';

type OrgRow = Pick<Organization, 'id' | 'slug' | 'name' | 'is_active' | 'created_at'>;

/**
 * Super admin — organizations list — /super-admin/organizations
 */
export default async function OrganizationsPage() {
  const admin = createAdminClient();

  // Fetch all orgs
  const { data: orgs, error } = await admin
    .from('organizations')
    .select('id, slug, name, is_active, created_at')
    .order('created_at', { ascending: false });

  const organizations = (orgs ?? []) as OrgRow[];

  // Fetch all org admin memberships so we can display "admin assigned" per org
  const { data: members } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('role', 'admin');

  const orgsWithAdmin = new Set(
    ((members ?? []) as Pick<OrganizationMember, 'organization_id'>[]).map(
      (m) => m.organization_id
    )
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Organizations</h1>
        <Link
          href="/super-admin/organizations/new"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-80"
        >
          + New Organization
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load organizations: {error.message}
        </div>
      )}

      {organizations.length === 0 && !error ? (
        <p className="text-sm text-zinc-500">No organizations yet. Create one to get started.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600">Slug</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Active</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Admin</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {organizations.map((org) => (
                <tr key={org.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/super-admin/organizations/${org.id}`}
                      className="font-mono text-xs text-zinc-700 underline-offset-2 hover:underline"
                    >
                      {org.slug}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-900">{org.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        org.is_active
                          ? 'inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                          : 'inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500'
                      }
                    >
                      {org.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {orgsWithAdmin.has(org.id) ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        None
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(org.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
