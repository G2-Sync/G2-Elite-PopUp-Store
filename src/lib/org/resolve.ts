import { createClient } from '@/lib/supabase/server';
import type { Organization } from '@/lib/supabase/types';

/**
 * Looks up an organization by its URL slug using the Supabase server client.
 *
 * RLS policy "orgs_public_select" permits anonymous reads of active orgs, so
 * no session is required. Returns null if the org does not exist or is inactive.
 */
export async function resolveOrgBySlug(slug: string): Promise<Organization | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Organization;
}
