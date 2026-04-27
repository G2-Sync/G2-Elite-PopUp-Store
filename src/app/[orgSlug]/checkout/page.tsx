import { squareIsLive } from './_actions';
import { getSquareEnvironment } from '@/lib/payments/square';
import CheckoutForm from './_form';

interface CheckoutPageProps {
  params: Promise<{ orgSlug: string }>;
}

/**
 * Checkout page server wrapper.
 *
 * Resolves Square config server-side (env, app id, whether real Square is
 * available for this org) and passes it to the client form.
 */
export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { orgSlug } = await params;

  const [squareReal, squareEnv] = await Promise.all([
    squareIsLive(orgSlug),
    Promise.resolve(getSquareEnvironment()),
  ]);

  const squareAppId = process.env.SQUARE_APPLICATION_ID ?? null;
  const squareLocationId = process.env.SQUARE_LOCATION_ID ?? null;

  return (
    <CheckoutForm
      orgSlug={orgSlug}
      squareReal={squareReal}
      squareEnv={squareEnv}
      squareAppId={squareAppId}
      squareLocationId={squareLocationId}
    />
  );
}
