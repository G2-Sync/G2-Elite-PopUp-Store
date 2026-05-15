'use client';

interface SandboxBannerProps {
  /**
   * "square" — Square SDK is rendering a real card form for this checkout.
   *            Banner text depends on `environment`:
   *              - sandbox: shows test-card hint
   *              - production: no banner (real money is live)
   * "mock" or undefined — non-Square or fallback mock mode. Shows generic
   *                       "Test Mode" warning.
   */
  variant?: 'square' | 'mock';
  /**
   * Active Square environment. Determines whether to show the test-card
   * sandbox hint or hide the banner entirely (production).
   */
  environment?: 'sandbox' | 'production';
}

/**
 * Mode-aware banner shown on checkout pages.
 *
 * - Square + production → no banner (real charges, no warning needed)
 * - Square + sandbox    → amber banner with test card hint
 * - Mock                → amber "Test Mode" banner
 */
export default function SandboxBanner({
  variant,
  environment,
}: SandboxBannerProps = {}) {
  if (variant === 'square') {
    if (environment === 'production') {
      // Real money flowing — no warning banner needed.
      return null;
    }
    return (
      <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-medium text-amber-800">
        🧪 Square Sandbox — use test card{' '}
        <span className="font-mono">4111 1111 1111 1111</span>, any future expiry, CVV{' '}
        <span className="font-mono">111</span>, any postal.
      </div>
    );
  }
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-medium text-amber-800">
      🧪 Test Mode — payments are simulated. No real charges will occur.
    </div>
  );
}
