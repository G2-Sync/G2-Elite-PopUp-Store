'use client';

import { useState, useTransition } from 'react';
import { updateOrgBranding } from '../_actions';
import type { Organization } from '@/lib/supabase/types';

const FONT_OPTIONS = [
  'Inter',
  'Playfair Display',
  'Poppins',
  'Roboto',
  'Space Grotesk',
  'Merriweather',
] as const;

interface BrandingFormProps {
  org: Organization;
}

export default function BrandingForm({ org }: BrandingFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [primaryColor, setPrimaryColor] = useState(org.primary_color);
  const [accentColor, setAccentColor] = useState(org.accent_color);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateOrgBranding(org.id, formData);
      if (result.ok) {
        setSuccess('Settings saved successfully.');
      } else {
        setError(result.error);
      }
    });
  }

  const inputCls =
    'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Slug (read-only) */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">URL</h2>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Slug</label>
          <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
            <span className="font-mono text-sm text-zinc-500">{org.slug}</span>
          </div>
          <p className="text-xs text-zinc-400">
            The store URL slug cannot be changed — changing it would break existing links.
          </p>
        </div>
      </section>

      {/* Basics */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Basics</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
              Store name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={org.name}
              className={inputCls}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="tagline" className="text-sm font-medium text-zinc-700">
              Tagline
            </label>
            <input
              id="tagline"
              name="tagline"
              type="text"
              defaultValue={org.tagline ?? ''}
              placeholder="Gear up. Play harder."
              className={inputCls}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="contact_email" className="text-sm font-medium text-zinc-700">
              Contact email
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={org.contact_email ?? ''}
              placeholder="hello@mystore.com"
              className={inputCls}
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      {/* Colors */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Colors</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ColorField
            id="primary_color"
            name="primary_color"
            label="Primary color"
            value={primaryColor}
            onChange={setPrimaryColor}
            disabled={isPending}
          />
          <ColorField
            id="accent_color"
            name="accent_color"
            label="Accent color"
            value={accentColor}
            onChange={setAccentColor}
            disabled={isPending}
          />
        </div>

        {/* Live preview of how the palette will look on the storefront */}
        <div className="mt-5 rounded-xl border border-zinc-200 p-5" style={{ backgroundColor: primaryColor }}>
          <p className="text-xs uppercase tracking-widest text-white/70">Preview</p>
          <p className="mt-2 text-xl font-bold text-white">{org.name}</p>
          {org.tagline && (
            <p className="mt-1 text-sm text-white/80">{org.tagline}</p>
          )}
          <button
            type="button"
            className="mt-4 inline-flex rounded-full px-5 py-2 text-sm font-semibold shadow-sm"
            style={{ backgroundColor: accentColor, color: primaryColor }}
          >
            Shop Now
          </button>
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Typography</h2>
        <div className="max-w-xs">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="font_family" className="text-sm font-medium text-zinc-700">
              Font family
            </label>
            <select
              id="font_family"
              name="font_family"
              defaultValue={org.font_family}
              className={inputCls}
              disabled={isPending}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Images */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Images</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <AssetField
            name="logo"
            label="Logo"
            currentUrl={org.logo_url}
            disabled={isPending}
          />
          <AssetField
            name="hero"
            label="Hero image"
            currentUrl={org.hero_image_url}
            disabled={isPending}
          />
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-4 border-t border-zinc-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ColorField
// ---------------------------------------------------------------------------

function ColorField({
  id,
  name,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          className="h-9 w-10 cursor-pointer rounded border border-zinc-300 bg-white p-0.5 disabled:opacity-50"
          disabled={disabled}
        />
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="^#[0-9a-fA-F]{6}$"
          placeholder="#000000"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AssetField
// ---------------------------------------------------------------------------

function AssetField({
  name,
  label,
  currentUrl,
  disabled,
}: {
  name: string;
  label: string;
  currentUrl: string | null;
  disabled: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={`${label} preview`}
          className="h-24 w-full rounded-lg border border-zinc-200 bg-zinc-50 object-contain"
        />
      )}
      <input
        type="file"
        name={name}
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setPreview(URL.createObjectURL(file));
        }}
        disabled={disabled}
        className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-50"
      />
    </div>
  );
}
