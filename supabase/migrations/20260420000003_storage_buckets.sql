-- =============================================================================
-- Storage: org-assets bucket
-- =============================================================================
-- Public bucket for org logos, hero images, and product images.
-- Super-admins upload via the service-role client (bypasses RLS on objects).
-- All objects are publicly readable.

insert into storage.buckets (id, name, public)
values ('org-assets', 'org-assets', true)
on conflict (id) do nothing;

-- Public read: anyone can view org assets (logos, hero images, product images)
create policy "org_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'org-assets');
