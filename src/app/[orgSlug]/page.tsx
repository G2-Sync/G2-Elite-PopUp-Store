import Link from 'next/link';
import { getOrgContext } from '@/lib/org/context';

interface OrgSplashPageProps {
  params: Promise<{ orgSlug: string }>;
}

/**
 * Org splash / landing page — /[orgSlug]
 *
 * Displays the org's hero with name, tagline, and a "Shop Now" CTA.
 * Uses CSS custom properties set by OrgThemeProvider for brand colors.
 * Hero image (if set) renders as a full-bleed background.
 */
export default async function OrgSplashPage({ params }: OrgSplashPageProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero section */}
      <section
        className="relative flex flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:py-32"
        style={
          org.hero_image_url
            ? {
                backgroundImage: `url(${org.hero_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                backgroundColor: 'var(--org-primary)',
              }
        }
      >
        {/* Overlay for readability when hero image is present */}
        {org.hero_image_url && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--org-primary)', opacity: 0.6 }}
            aria-hidden="true"
          />
        )}

        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {org.name}
          </h1>

          {org.tagline && (
            <p className="mt-4 text-lg text-white/80 sm:text-xl">
              {org.tagline}
            </p>
          )}

          <div className="mt-10">
            <Link
              href={`/${orgSlug}/shop`}
              className="inline-flex items-center rounded-full px-8 py-3 text-sm font-semibold shadow-md transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor: 'var(--org-accent)',
                color: 'var(--org-primary)',
              }}
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
