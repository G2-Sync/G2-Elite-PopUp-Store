'use server';

import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;
const FONT_OPTIONS = [
  'Inter',
  'Playfair Display',
  'Poppins',
  'Roboto',
  'Space Grotesk',
  'Merriweather',
];

function validateHex(value: string): boolean {
  return HEX_PATTERN.test(value);
}

// ---------------------------------------------------------------------------
// createOrganization
// ---------------------------------------------------------------------------

export async function createOrganization(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const rawSlug = (formData.get('slug') as string | null)?.trim() ?? '';
  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const tagline = (formData.get('tagline') as string | null)?.trim() || null;
  const contact_email = (formData.get('contact_email') as string | null)?.trim() || null;
  const is_active = formData.get('is_active') !== 'false';
  const primary_color = (formData.get('primary_color') as string | null)?.trim() ?? '#0F172A';
  const accent_color = (formData.get('accent_color') as string | null)?.trim() ?? '#F59E0B';
  const font_family = (formData.get('font_family') as string | null)?.trim() ?? 'Inter';

  // Validate slug
  const slug = slugify(rawSlug) || rawSlug;
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      error: 'Slug must contain only lowercase letters, numbers, and hyphens.',
    };
  }

  if (!name) {
    return { ok: false, error: 'Organization name is required.' };
  }

  if (!validateHex(primary_color)) {
    return { ok: false, error: 'Primary color must be a valid hex color (e.g. #0F172A).' };
  }

  if (!validateHex(accent_color)) {
    return { ok: false, error: 'Accent color must be a valid hex color (e.g. #F59E0B).' };
  }

  if (!FONT_OPTIONS.includes(font_family)) {
    return { ok: false, error: 'Invalid font selection.' };
  }

  // Check slug uniqueness
  const { data: existing } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: `Slug "${slug}" is already taken.` };
  }

  const { data, error } = await admin
    .from('organizations')
    .insert({
      slug,
      name,
      tagline,
      contact_email,
      is_active,
      primary_color,
      accent_color,
      font_family,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Failed to create organization.' };
  }

  redirect(`/super-admin/organizations/${data.id}`);
}

// ---------------------------------------------------------------------------
// updateOrganization
// ---------------------------------------------------------------------------

export async function updateOrganization(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const tagline = (formData.get('tagline') as string | null)?.trim() || null;
  const contact_email = (formData.get('contact_email') as string | null)?.trim() || null;
  const is_active = formData.get('is_active') !== 'false';
  const primary_color = (formData.get('primary_color') as string | null)?.trim() ?? '#0F172A';
  const accent_color = (formData.get('accent_color') as string | null)?.trim() ?? '#F59E0B';
  const font_family = (formData.get('font_family') as string | null)?.trim() ?? 'Inter';

  if (!name) {
    return { ok: false, error: 'Organization name is required.' };
  }

  if (!validateHex(primary_color)) {
    return { ok: false, error: 'Primary color must be a valid hex color.' };
  }

  if (!validateHex(accent_color)) {
    return { ok: false, error: 'Accent color must be a valid hex color.' };
  }

  if (!FONT_OPTIONS.includes(font_family)) {
    return { ok: false, error: 'Invalid font selection.' };
  }

  const { error } = await admin
    .from('organizations')
    .update({ name, tagline, contact_email, is_active, primary_color, accent_color, font_family })
    .eq('id', id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// toggleOrgActive
// ---------------------------------------------------------------------------

export async function toggleOrgActive(id: string): Promise<ActionResult> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('is_active')
    .eq('id', id)
    .single();

  if (!org) {
    return { ok: false, error: 'Organization not found.' };
  }

  const { error } = await admin
    .from('organizations')
    .update({ is_active: !org.is_active })
    .eq('id', id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// uploadOrgAsset
// ---------------------------------------------------------------------------

export async function uploadOrgAsset(
  orgId: string,
  kind: 'logo' | 'hero',
  file: File
): Promise<ActionResult<{ url: string }>> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${orgId}/${kind}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from('org-assets')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data: urlData } = admin.storage.from('org-assets').getPublicUrl(path);

  const updatePayload =
    kind === 'logo'
      ? { logo_url: urlData.publicUrl }
      : { hero_image_url: urlData.publicUrl };
  const { error: updateError } = await admin
    .from('organizations')
    .update(updatePayload)
    .eq('id', orgId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true, data: { url: urlData.publicUrl } };
}

// ---------------------------------------------------------------------------
// findUserByEmail — search auth.users via the admin API
// ---------------------------------------------------------------------------

/**
 * Look up a Supabase auth user by their email address.
 *
 * Uses auth.admin.listUsers with simple pagination. Fine at our scale
 * (hundreds of users max); would want a server-side lookup table or RPC
 * if user count grows into the thousands.
 */
async function findUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<{ id: string; email: string } | null> {
  const target = email.trim().toLowerCase();
  let page = 1;
  // Safety cap so we don't loop forever
  const MAX_PAGES = 20;
  while (page <= MAX_PAGES) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data) return null;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found?.email) return { id: found.id, email: found.email };
    if (data.users.length < 100) return null; // last page
    page += 1;
  }
  return null;
}

// ---------------------------------------------------------------------------
// inviteOrgAdmin
// ---------------------------------------------------------------------------

export async function inviteOrgAdmin(
  orgId: string,
  email: string
): Promise<ActionResult<{ existing: boolean }>> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  // Fetch org slug for the redirectTo URL
  const { data: org } = await admin
    .from('organizations')
    .select('slug')
    .eq('id', orgId)
    .single();

  if (!org) {
    return { ok: false, error: 'Organization not found.' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  // Route through /auth/callback (exchanges the code for a session) then to
  // /reset-password (where the user actually sets their password).
  const redirectTo = `${siteUrl}/auth/callback?next=/reset-password`;
  const trimmedEmail = email.trim().toLowerCase();

  // First, check if a user with this email already exists in auth.users.
  const existingUser = await findUserByEmail(admin, trimmedEmail);

  let userId: string;
  let isExisting = false;

  if (existingUser) {
    // User already has an auth account — just add them to the org and send
    // them a password-reset link so they have a fresh way in.
    isExisting = true;
    userId = existingUser.id;

    const { error: resetError } = await admin.auth.resetPasswordForEmail(
      existingUser.email,
      { redirectTo }
    );
    // Don't bail on email failure — membership is the more important part.
    if (resetError) {
      console.error('[inviteOrgAdmin] resetPasswordForEmail failed (proceeding):', resetError);
    }
  } else {
    // Brand-new user — use Supabase's full invite flow.
    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(trimmedEmail, { redirectTo });

    if (inviteError || !inviteData.user) {
      return {
        ok: false,
        error: inviteError?.message ?? 'Invite failed — no user returned.',
      };
    }
    userId = inviteData.user.id;
  }

  // Upsert the organization_members row.
  const { error: memberError } = await admin
    .from('organization_members')
    .upsert(
      { organization_id: orgId, user_id: userId, role: 'admin' },
      { onConflict: 'organization_id,user_id' }
    );

  if (memberError) {
    return { ok: false, error: memberError.message };
  }

  return { ok: true, data: { existing: isExisting } };
}

// ---------------------------------------------------------------------------
// resendInvite — sends a fresh password-reset email to the existing admin
// ---------------------------------------------------------------------------

export async function resendInvite(orgId: string): Promise<ActionResult> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  // Find the existing admin member
  const { data: member } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('role', 'admin')
    .maybeSingle();

  if (!member) {
    return { ok: false, error: 'No admin assigned to this organization.' };
  }

  const { data: userResponse, error: userError } = await admin.auth.admin.getUserById(
    member.user_id
  );

  if (userError || !userResponse.user?.email) {
    return { ok: false, error: 'Could not retrieve admin email.' };
  }

  // Fetch org slug for the redirectTo URL
  const { data: org } = await admin
    .from('organizations')
    .select('slug')
    .eq('id', orgId)
    .single();

  if (!org) {
    return { ok: false, error: 'Organization not found.' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  // Route through /auth/callback (exchanges the code for a session) then to
  // /reset-password (where the user actually sets their password).
  const redirectTo = `${siteUrl}/auth/callback?next=/reset-password`;

  // Send a password-reset email — the user can set/reset their password
  // and land back in their admin area.
  const { error: resetError } = await admin.auth.resetPasswordForEmail(
    userResponse.user.email,
    { redirectTo }
  );

  if (resetError) {
    return { ok: false, error: resetError.message };
  }

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// removeOrgAdmin
// ---------------------------------------------------------------------------

export async function removeOrgAdmin(
  orgId: string,
  userId: string
): Promise<ActionResult> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined };
}
