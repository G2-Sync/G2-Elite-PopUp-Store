'use client';

interface SandboxBannerProps {
  /**
   * If "square" — show the Square sandbox-specific test-card hint.
   * If undefined — show the generic test-mode message.
   */
  variant?: 'square' | 'mock';
}

/**
 * Yellow test-mode banner shown on cart and checkout pages.
 * Always visible — no dismiss in production, keeps it simple.
 */
export default function SandboxBanner({ variant }: SandboxBannerProps = {}) {
  if (variant === 'square') {
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
