'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgAdmin, isCurrentUserSuperAdmin } from '@/lib/auth/session';
import { slugify } from '@/lib/utils';
import type { OrderStatus, ProductImage } from '@/lib/supabase/types';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// createProduct
// ---------------------------------------------------------------------------

export async function createProduct(
  orgId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const rawSlug = (formData.get('slug') as string | null)?.trim() || slugify(name);
  const description = (formData.get('description') as string | null)?.trim() || null;
  const priceStr = (formData.get('price') as string | null)?.trim() ?? '0';
  const categoryId = (formData.get('category_id') as string | null)?.trim() || null;
  const stockStr = (formData.get('stock') as string | null)?.trim() ?? '0';
  const isActive = formData.get('is_active') !== 'false';

  if (!name) return { ok: false, error: 'Product name is required.' };

  const price_cents = Math.round(parseFloat(priceStr) * 100);
  if (isNaN(price_cents) || price_cents < 0) {
    return { ok: false, error: 'Price must be a valid non-negative number.' };
  }

  const stock = parseInt(stockStr, 10);
  if (isNaN(stock) || stock < 0) {
    return { ok: false, error: 'Stock must be a non-negative integer.' };
  }

  const slug = slugify(rawSlug) || slugify(name);
  if (!slug) return { ok: false, error: 'Could not generate a valid slug from the product name.' };

  // Check slug uniqueness within org
  const { data: existing } = await admin
    .from('products')
    .select('id')
    .eq('organization_id', orgId)
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: `A product with slug "${slug}" already exists in this store.` };
  }

  const { data: product, error: insertError } = await admin
    .from('products')
    .insert({
      organization_id: orgId,
      name,
      slug,
      description,
      price_cents,
      category_id: categoryId,
      stock,
      is_active: isActive,
    })
    .select('id')
    .single();

  if (insertError || !product) {
    return { ok: false, error: insertError?.message ?? 'Failed to create product.' };
  }

  // Upload images
  const images = formData.getAll('images') as File[];
  const validImages = images.filter((f) => f instanceof File && f.size > 0);

  if (validImages.length > 0) {
    const uploadResult = await uploadProductImages(orgId, product.id, validImages);
    if (!uploadResult.ok) {
      // Product created but images failed — still redirect, log the error
      console.error('Image upload failed after product creation:', uploadResult.error);
    }
  }

  redirect(`/${await getOrgSlug(orgId)}/admin/products`);
}

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------

export async function updateProduct(
  orgId: string,
  productId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const rawSlug = (formData.get('slug') as string | null)?.trim() || slugify(name);
  const description = (formData.get('description') as string | null)?.trim() || null;
  const priceStr = (formData.get('price') as string | null)?.trim() ?? '0';
  const categoryId = (formData.get('category_id') as string | null)?.trim() || null;
  const stockStr = (formData.get('stock') as string | null)?.trim() ?? '0';
  const isActive = formData.get('is_active') !== 'false';

  if (!name) return { ok: false, error: 'Product name is required.' };

  const price_cents = Math.round(parseFloat(priceStr) * 100);
  if (isNaN(price_cents) || price_cents < 0) {
    return { ok: false, error: 'Price must be a valid non-negative number.' };
  }

  const stock = parseInt(stockStr, 10);
  if (isNaN(stock) || stock < 0) {
    return { ok: false, error: 'Stock must be a non-negative integer.' };
  }

  const slug = slugify(rawSlug) || slugify(name);
  if (!slug) return { ok: false, error: 'Could not generate a valid slug.' };

  // Check slug uniqueness — exclude current product
  const { data: existing } = await admin
    .from('products')
    .select('id')
    .eq('organization_id', orgId)
    .eq('slug', slug)
    .neq('id', productId)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: `A product with slug "${slug}" already exists.` };
  }

  const { error } = await admin
    .from('products')
    .update({ name, slug, description, price_cents, category_id: categoryId, stock, is_active: isActive })
    .eq('id', productId)
    .eq('organization_id', orgId);

  if (error) return { ok: false, error: error.message };

  // Upload any new images
  const images = formData.getAll('images') as File[];
  const validImages = images.filter((f) => f instanceof File && f.size > 0);
  if (validImages.length > 0) {
    await uploadProductImages(orgId, productId, validImages);
  }

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// deleteProduct
// ---------------------------------------------------------------------------

export async function deleteProduct(
  orgId: string,
  productId: string
): Promise<ActionResult> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  // Fetch all images to delete from storage
  const { data: images } = await admin
    .from('product_images')
    .select('url')
    .eq('product_id', productId)
    .eq('organization_id', orgId);

  if (images && images.length > 0) {
    // Extract storage paths from URLs
    const paths = images
      .map((img) => {
        const url = img.url;
        const marker = '/org-assets/';
        const idx = url.indexOf(marker);
        return idx >= 0 ? url.slice(idx + marker.length) : null;
      })
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await admin.storage.from('org-assets').remove(paths);
    }
  }

  const { error } = await admin
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('organization_id', orgId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// toggleProductActive
// ---------------------------------------------------------------------------

export async function toggleProductActive(
  orgId: string,
  productId: string
): Promise<ActionResult> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  const { data: product } = await admin
    .from('products')
    .select('is_active')
    .eq('id', productId)
    .eq('organization_id', orgId)
    .single();

  if (!product) return { ok: false, error: 'Product not found.' };

  const { error } = await admin
    .from('products')
    .update({ is_active: !product.is_active })
    .eq('id', productId)
    .eq('organization_id', orgId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// uploadProductImages
// ---------------------------------------------------------------------------

export async function uploadProductImages(
  orgId: string,
  productId: string,
  files: File[]
): Promise<ActionResult<{ urls: string[] }>> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  // Check if this product already has images (to decide primary flag)
  const { data: existingImages } = await admin
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .eq('organization_id', orgId);

  const hasExisting = (existingImages?.length ?? 0) > 0;
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop() ?? 'jpg';
    const uuid = crypto.randomUUID();
    const path = `${orgId}/products/${productId}/${uuid}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from('org-assets')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { ok: false, error: `Failed to upload ${file.name}: ${uploadError.message}` };
    }

    const { data: urlData } = admin.storage.from('org-assets').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // First file becomes primary if no existing images
    const isPrimary = !hasExisting && i === 0;

    const { error: insertError } = await admin.from('product_images').insert({
      product_id: productId,
      organization_id: orgId,
      url: publicUrl,
      is_primary: isPrimary,
      sort_order: (existingImages?.length ?? 0) + i,
    });

    if (insertError) {
      return { ok: false, error: insertError.message };
    }

    urls.push(publicUrl);
  }

  return { ok: true, data: { urls } };
}

// ---------------------------------------------------------------------------
// removeProductImage
// ---------------------------------------------------------------------------

export async function removeProductImage(
  orgId: string,
  productId: string,
  imageId: string
): Promise<ActionResult> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  const { data: image } = await admin
    .from('product_images')
    .select('url, is_primary')
    .eq('id', imageId)
    .eq('product_id', productId)
    .eq('organization_id', orgId)
    .single();

  if (!image) return { ok: false, error: 'Image not found.' };

  // Delete from storage
  const url = image.url;
  const marker = '/org-assets/';
  const idx = url.indexOf(marker);
  if (idx >= 0) {
    const storagePath = url.slice(idx + marker.length);
    await admin.storage.from('org-assets').remove([storagePath]);
  }

  const { error } = await admin
    .from('product_images')
    .delete()
    .eq('id', imageId)
    .eq('product_id', productId);

  if (error) return { ok: false, error: error.message };

  // If this was the primary image, promote the next one
  if (image.is_primary) {
    const { data: remaining } = await admin
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await admin
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', remaining[0].id);
    }
  }

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// setPrimaryImage
// ---------------------------------------------------------------------------

export async function setPrimaryImage(
  orgId: string,
  productId: string,
  imageId: string
): Promise<ActionResult> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  // Unset all primaries for this product
  await admin
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
    .eq('organization_id', orgId);

  // Set the target
  const { error } = await admin
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('product_id', productId)
    .eq('organization_id', orgId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// createCategory
// ---------------------------------------------------------------------------

export async function createCategory(
  orgId: string,
  name: string
): Promise<ActionResult<{ id: string }>> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: 'Category name is required.' };

  const slug = slugify(trimmed);
  if (!slug) return { ok: false, error: 'Could not generate a valid slug.' };

  // Next sort_order
  const { data: maxRow } = await admin
    .from('categories')
    .select('sort_order')
    .eq('organization_id', orgId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await admin
    .from('categories')
    .insert({ organization_id: orgId, name: trimmed, slug, sort_order })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create category.' };

  return { ok: true, data: { id: data.id } };
}

// ---------------------------------------------------------------------------
// updateCategory
// ---------------------------------------------------------------------------

export async function updateCategory(
  orgId: string,
  categoryId: string,
  updates: { name?: string; sort_order?: number }
): Promise<ActionResult> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  const payload: { name?: string; slug?: string; sort_order?: number } = {};

  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (!name) return { ok: false, error: 'Category name cannot be empty.' };
    payload.name = name;
    payload.slug = slugify(name);
  }

  if (updates.sort_order !== undefined) {
    payload.sort_order = updates.sort_order;
  }

  if (Object.keys(payload).length === 0) return { ok: true, data: undefined };

  const { error } = await admin
    .from('categories')
    .update(payload)
    .eq('id', categoryId)
    .eq('organization_id', orgId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// deleteCategory
// ---------------------------------------------------------------------------

export async function deleteCategory(
  orgId: string,
  categoryId: string
): Promise<ActionResult> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  // Detach products from this category
  await admin
    .from('products')
    .update({ category_id: null })
    .eq('category_id', categoryId)
    .eq('organization_id', orgId);

  const { error } = await admin
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('organization_id', orgId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// updateOrderStatus
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'refunded'],
  shipped: ['fulfilled', 'refunded'],
  fulfilled: [],
  cancelled: [],
  refunded: [],
};

export async function updateOrderStatus(
  orgId: string,
  orderId: string,
  newStatus: OrderStatus
): Promise<ActionResult> {
  await requireOrgAdmin(orgId);
  const admin = createAdminClient();

  const { data: order } = await admin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .eq('organization_id', orgId)
    .single();

  if (!order) return { ok: false, error: 'Order not found.' };

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return {
      ok: false,
      error: `Cannot transition from "${order.status}" to "${newStatus}".`,
    };
  }

  const { error } = await admin
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .eq('organization_id', orgId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// updateOrgBranding
// ---------------------------------------------------------------------------

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;
const FONT_OPTIONS = [
  'Inter',
  'Playfair Display',
  'Poppins',
  'Roboto',
  'Space Grotesk',
  'Merriweather',
];

export async function updateOrgBranding(
  orgId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireOrgAdmin(orgId);

  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const tagline = (formData.get('tagline') as string | null)?.trim() || null;
  const contact_email = (formData.get('contact_email') as string | null)?.trim() || null;
  const primary_color = (formData.get('primary_color') as string | null)?.trim() ?? '#0F172A';
  const accent_color = (formData.get('accent_color') as string | null)?.trim() ?? '#F59E0B';
  const font_family = (formData.get('font_family') as string | null)?.trim() ?? 'Inter';

  if (!name) return { ok: false, error: 'Organization name is required.' };
  if (!HEX_PATTERN.test(primary_color)) return { ok: false, error: 'Invalid primary color.' };
  if (!HEX_PATTERN.test(accent_color)) return { ok: false, error: 'Invalid accent color.' };
  if (!FONT_OPTIONS.includes(font_family)) return { ok: false, error: 'Invalid font selection.' };

  // Super-admins use admin client; regular org admins use server client (RLS enforces ownership)
  const isSuperAdmin = await isCurrentUserSuperAdmin();

  if (isSuperAdmin) {
    const admin = createAdminClient();
    const { error } = await admin
      .from('organizations')
      .update({ name, tagline, contact_email, primary_color, accent_color, font_family })
      .eq('id', orgId);
    if (error) return { ok: false, error: error.message };
  } else {
    const supabase = await createClient();
    const { error } = await supabase
      .from('organizations')
      .update({ name, tagline, contact_email, primary_color, accent_color, font_family })
      .eq('id', orgId);
    if (error) return { ok: false, error: error.message };
  }

  // Handle logo/hero uploads if provided
  const logoFile = formData.get('logo') as File | null;
  const heroFile = formData.get('hero') as File | null;
  const admin = createAdminClient();

  if (logoFile instanceof File && logoFile.size > 0) {
    const ext = logoFile.name.split('.').pop() ?? 'png';
    const path = `${orgId}/logo.${ext}`;
    const { error: uploadErr } = await admin.storage
      .from('org-assets')
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
    if (!uploadErr) {
      const { data } = admin.storage.from('org-assets').getPublicUrl(path);
      await admin.from('organizations').update({ logo_url: data.publicUrl }).eq('id', orgId);
    }
  }

  if (heroFile instanceof File && heroFile.size > 0) {
    const ext = heroFile.name.split('.').pop() ?? 'jpg';
    const path = `${orgId}/hero.${ext}`;
    const { error: uploadErr } = await admin.storage
      .from('org-assets')
      .upload(path, heroFile, { upsert: true, contentType: heroFile.type });
    if (!uploadErr) {
      const { data } = admin.storage.from('org-assets').getPublicUrl(path);
      await admin.from('organizations').update({ hero_image_url: data.publicUrl }).eq('id', orgId);
    }
  }

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

async function getOrgSlug(orgId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('organizations')
    .select('slug')
    .eq('id', orgId)
    .single();
  return data?.slug ?? '';
}
