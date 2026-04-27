# Square Setup Guide

This guide walks through setting up Square payments for the platform —
including the platform-level sandbox account (used as a fallback for any
org that hasn't connected their own Square merchant) and the per-org
OAuth Connect flow.

---

## 1. Create a Square Developer Account

1. Go to **https://developer.squareup.com**
2. Sign up (free) or log in with your existing Square account
3. You'll land on the Developer Dashboard

---

## 2. Create an Application

1. From the Dashboard, click **+ Create your first application** (or **+ Add Application**)
2. Name it (e.g. `G2 Elite Pop-Up Store`)
3. Click **Create Application**

---

## 3. Get Sandbox Credentials

In your application, switch the toggle in the top-right from **Production** to **Sandbox**.

### Application ID + Secret
- Sidebar: **Credentials**
- Under **Sandbox**:
  - Copy **Application ID** → goes into `SQUARE_APPLICATION_ID` and `NEXT_PUBLIC_SQUARE_APPLICATION_ID`
  - Click **Show** next to **Application Secret** → copy → goes into `SQUARE_APPLICATION_SECRET`

### Access Token
- Same Credentials page, scroll to **Access token (Sandbox)**
- Copy → goes into `SQUARE_ACCESS_TOKEN`

This is the **platform's own sandbox merchant** access token, used as a
fallback when an org hasn't connected their own Square account.

### Location ID
- Sidebar: **Locations**
- You'll see at least one default sandbox location. Copy its **Location ID**
- Goes into `SQUARE_LOCATION_ID`

---

## 4. Configure OAuth (for per-org Connect)

1. Sidebar: **OAuth**
2. Add a **Sandbox Redirect URL**: `http://localhost:3000/api/connect/square/callback`
3. (When you deploy, also add your production redirect URL: `https://yourdomain.com/api/connect/square/callback`)
4. Save

---

## 5. Configure Webhooks (optional for now, required for production)

1. Sidebar: **Webhooks → Subscriptions**
2. **+ Add Subscription**
3. **Notification URL**:
   - For local dev: you'll need a public tunnel like ngrok (`ngrok http 3000`) — point Square at the tunnel URL `+/api/webhooks/square`
   - For production: `https://yourdomain.com/api/webhooks/square`
4. **Subscribed Events**: at minimum
   - `payment.updated`
   - `refund.created`
   - `refund.updated`
5. After saving, copy the **Signature Key** → goes into `SQUARE_WEBHOOK_SIGNATURE_KEY`

You can skip this until you're ready to test refund + dispute handling.
Phase 4's checkout marks orders as paid synchronously, so basic flow works
without webhooks.

---

## 6. Generate Token Encryption Key

This encrypts org OAuth tokens at rest in Postgres.

```bash
openssl rand -base64 32
```

Copy the output → goes into `PAYMENT_TOKEN_ENCRYPTION_KEY`.

⚠️ **Never change this key after orgs connect Square** — you'll lose the
ability to decrypt their tokens and they'll have to reconnect.

---

## 7. Update `.env.local`

Open `/G2-Elite-PopUp-Store/.env.local` and fill in:

```
# Square — platform-level
SQUARE_ENVIRONMENT=sandbox
SQUARE_APPLICATION_ID=<sandbox app id>
SQUARE_APPLICATION_SECRET=<sandbox app secret>
SQUARE_ACCESS_TOKEN=<sandbox access token>
SQUARE_LOCATION_ID=<sandbox location id>
SQUARE_WEBHOOK_SIGNATURE_KEY=<webhook signature key, optional now>
NEXT_PUBLIC_SQUARE_APPLICATION_ID=<same as SQUARE_APPLICATION_ID>

# Token encryption
PAYMENT_TOKEN_ENCRYPTION_KEY=<openssl rand output>
```

⚠️ **Never commit `.env.local`** — it's already in `.gitignore`.
⚠️ **Never share these values** — anyone with them can charge through your sandbox.

---

## 8. Restart the Dev Server

```bash
# Stop the running server (Ctrl+C in the terminal where it runs)
# Then:
cd /Users/stangrahamstangraham/Documents/g2/G2-Elite-PopUp-Store
npm run dev
```

Env vars only load on startup, so a restart is required.

---

## 9. Test the Platform Sandbox Flow

This is the simplest test — uses the platform's Square sandbox account
without any org doing OAuth.

1. Open `http://localhost:3000/acme/shop`
2. Add a product to cart → go to checkout
3. The Square option should now show **Sandbox** label (instead of "Test Mode")
4. A card form will render below the payment selector
5. Use Square's test card:
   - **Card number**: `4111 1111 1111 1111`
   - **Expiry**: any future date (e.g. `12/30`)
   - **CVV**: `111`
   - **Postal**: any (e.g. `60601`)
6. Click **Pay & Place Order**
7. You should land on the confirmation page with a real Square payment ID
   (no longer `test_...`)
8. Check the order in `/acme/admin/orders` — `payment_id` will be Square's id

If you see "Card form not ready yet" — wait a few seconds for the SDK to load
and try again.

### Test failure cards

Square has test cards that simulate declines, expired cards, etc. Useful
for testing error states. See:
https://developer.squareup.com/docs/devtools/sandbox/payments

---

## 10. Test the OAuth Connect Flow (per-org)

This connects an org to a *separate* sandbox merchant account so payments
can route to that merchant rather than the platform.

1. Sign into Square Developer → **Sandbox Test Accounts** (left sidebar)
2. Create a new sandbox seller account (or use an existing one) — note its
   email + password
3. In another browser/incognito, log out of Square
4. Back in your app: open `/acme/admin/settings/payments`
5. Click **Connect Square**
6. You'll be redirected to Square's OAuth consent page
7. Sign in with the sandbox seller account credentials
8. Authorize the app
9. You'll be redirected back to `/acme/admin/settings/payments?connected=square`
10. The card now shows **Connected** with the merchant ID
11. Place a test order → it'll route through the org's connected account
    (not the platform's)

### What if it fails?

Common issues:
- **"redirect_uri_mismatch"** — the redirect URL in Square Developer doesn't
  exactly match `http://localhost:3000/api/connect/square/callback`
- **"invalid_state"** — the state cookie expired (10 min) or browser blocked
  it. Try again.
- **"db_save_failed"** — check Supabase logs and the `payment_accounts` table

---

## 11. Going to Production (later)

When you're ready for real money:

1. In Square Developer Dashboard, switch to **Production** view (top-right)
2. Apply for production access (requires business info, may take review time)
3. Once approved, copy production credentials
4. Update env vars (use production redirect URLs, swap `SQUARE_ENVIRONMENT=production`)
5. Set up production webhooks
6. Deploy

---

## Architecture summary

The platform supports three Square modes simultaneously, picked automatically:

| Mode | When | Money goes to |
|------|------|---------------|
| `connected` | Org has linked their own Square account via OAuth | Org's bank |
| `platform_sandbox` | Org hasn't connected, but platform has sandbox creds | Platform's sandbox balance (fake money) |
| `mock` | Neither configured | Nowhere — order is created with `payment_id: 'test_...'` |

Stripe and PayPal currently always run in mock mode. Phase 6 will add
real Stripe Connect + PayPal Partner integration following the same
pattern.
