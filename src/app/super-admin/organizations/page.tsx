import { createAdminClient } from '@/lib/supabase/admin';
import type { Organization } from '@/lib/supabase/types';

/**
 * Super admin — organizations list — /super-admin/organizations
 *
 * Uses the service-role admin client so it bypasses RLS and can see all orgs,
 * including inactive ones. Create/edit forms come in Phase 2.
 */
export default async function OrganizationsPage() {
  const supabase = createAdminClient();

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, slug, name, is_active, created_at')
    .order('created_at', { ascending: false });

  const organizations = (orgs ?? []) as Pick<
    Organization,
    'id' | 'slug' | 'name' | 'is_active' | 'created_at'
  >[];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Organizations
        </h1>
        {/* Create button — Phase 2 */}
        <span className="text-xs text-zinc-400 dark:text-zinc-600">
          Create org — Phase 2
        </span>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          Failed to load organizations: {error.message}
        </div>
      )}

      {organizations.length === 0 && !error ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No organizations found. Create one to get started.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Slug</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Name</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Active</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {org.slug}
                  </td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">{org.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        org.is_active
                          ? 'inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }
                    >
                      {org.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
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
