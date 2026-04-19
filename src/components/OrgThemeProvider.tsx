import type { Organization } from '@/lib/supabase/types';

interface OrgThemeProviderProps {
  org: Organization;
  children: React.ReactNode;
}

/**
 * Server component that injects per-org CSS custom properties into the page.
 *
 * Renders a <style> block that overrides the global --org-* variables defined
 * in globals.css. Because this is a server component, there is zero client JS
 * overhead — the variables land in the initial HTML payload.
 *
 * Consuming components reference `var(--org-primary)`, `var(--org-accent)`,
 * and `var(--org-font)` via Tailwind's arbitrary-value syntax or inline styles.
 */
export default function OrgThemeProvider({ org, children }: OrgThemeProviderProps) {
  const css = `
    :root {
      --org-primary: ${org.primary_color};
      --org-accent: ${org.accent_color};
      --org-font: '${org.font_family}', sans-serif;
    }
    body {
      font-family: var(--org-font);
    }
  `.trim();

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}
