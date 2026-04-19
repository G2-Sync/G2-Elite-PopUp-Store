import { notFound } from 'next/navigation';
import { resolveOrgBySlug } from './resolve';
import type { Organization } from '@/lib/supabase/types';

/**
 * Primary way server components / route handlers get the current org.
 *
 * Fetches the org by slug and throws Next.js's notFound() error (which renders
 * the nearest not-found.tsx boundary) if the org is missing or inactive.
 *
 * Usage:
 *   const org = await getOrgContext({ orgSlug: params.orgSlug });
 */
export async function getOrgContext(params: { orgSlug: string }): Promise<Organization> {
  const org = await resolveOrgBySlug(params.orgSlug);

  if (!org) {
    notFound();
  }

  return org;
}
