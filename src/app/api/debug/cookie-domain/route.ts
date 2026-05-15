import { NextResponse } from 'next/server';

/**
 * Debug endpoint — TEMPORARY. Remove once auth is working.
 *
 * Returns whether the COOKIE_DOMAIN env var is reaching the running code,
 * plus a few non-sensitive details to help debug Vercel env var propagation.
 *
 * Visit: /api/debug/cookie-domain
 */
export async function GET() {
  const cd = process.env.COOKIE_DOMAIN;
  return NextResponse.json({
    cookie_domain_set: typeof cd === 'string' && cd.length > 0,
    cookie_domain_value: cd ?? null, // domain isn't secret, fine to echo
    cookie_domain_length: cd?.length ?? 0,
    starts_with_dot: cd?.startsWith('.') ?? false,
    site_url: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    default_org_slug: process.env.DEFAULT_ORG_SLUG ?? null,
    node_env: process.env.NODE_ENV,
  });
}
