# 💳 Stripe Payment Integration Setup

## Quick Start

GymPulse now supports real Stripe payments for Premium subscriptions!

**Pricing:**
- Monthly: $4.99/month
- Yearly: $49.99/year (17% off)

## Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Create an account (or login)
3. Complete business verification

## Step 2: Create Products & Prices in Stripe

### Monthly Plan

1. Go to [Products](https://dashboard.stripe.com/products)
2. Click **+ Add product**
3. Fill in:
   - **Name**: GymPulse Premium Monthly
   - **Description**: Advanced analytics, peak hour alerts, Apple Health sync
   - **Pricing**: Recurring
   - **Price**: $4.99 USD
   - **Billing period**: Monthly
4. Click **Save product**
5. **Copy the Price ID** (starts with `price_...`)

### Yearly Plan

1. Click **+ Add product** again
2. Fill in:
   - **Name**: GymPulse Premium Yearly
   - **Description**: All premium features + save $10/year
   - **Pricing**: Recurring
   - **Price**: $49.99 USD
   - **Billing period**: Yearly
3. Click **Save product**
4. **Copy the Price ID**

## Step 3: Get API Keys

1. Go to [API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_...` for test mode)
3. Copy your **Secret key** (starts with `sk_test_...`) - keep this secure!

## Step 4: Update .env File

Add to your `.env` file:

```env
# Stripe keys
VITE_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_MONTHLY_PRICE_ID=price_monthly_id_from_step_2
VITE_STRIPE_YEARLY_PRICE_ID=price_yearly_id_from_step_2
```

## Step 5: Deploy Edge Functions to Supabase

### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### Login & Init

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref swkqwqtgbxymyhcnhmfv
```

### Deploy Functions

```bash
# Deploy checkout session function
supabase functions deploy create-checkout-session --no-verify-jwt

# Deploy webhook handler
supabase functions deploy stripe-webhook --no-verify-jwt
```

### Set Environment Variables in Supabase

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Set webhook secret (get from Stripe after step 6)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Step 6: Configure Stripe Webhook

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **+ Add endpoint**
3. Enter endpoint URL:
   ```
   https://swkqwqtgbxymyhcnhmfv.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. **Copy the Signing secret** (starts with `whsec_...`)
7. Update Supabase secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

## Step 7: Update Database Schema

Run in Supabase SQL Editor:

```bash
# File already created: supabase-subscriptions.sql
```

Copy the SQL from `supabase-subscriptions.sql` and run it.

## Step 8: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com)
2. Navigate to your project → Settings → Environment Variables
3. Add:
   - `VITE_STRIPE_PUBLIC_KEY` = your publishable key
   - `VITE_STRIPE_MONTHLY_PRICE_ID` = monthly price ID
   - `VITE_STRIPE_YEARLY_PRICE_ID` = yearly price ID
4. Redeploy

## Step 9: Test Payment Flow

### Test Mode (Using Stripe Test Cards)

1. Go to Premium tab in your app
2. Select a plan
3. Click "Get Premium"
4. Use test card: `4242 4242 4242 4242`
5. Any future expiry date
6. Any CVC
7. Complete checkout

### Test Cards Reference

- **Success**: `4242 4242 4242 4242`
- **Requires Auth**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 9995`

[More test cards](https://stripe.com/docs/testing)

## Step 10: Go Live

When ready for production:

1. Go to Stripe Dashboard → [Activate account](https://dashboard.stripe.com/account/onboarding)
2. Complete business verification
3. Switch to **Live mode** toggle
4. Get live API keys (start with `pk_live_...` and `sk_live_...`)
5. Create production products/prices
6. Update environment variables with live keys
7. Update webhook to use live endpoint

## Features Included

✅ **Secure Checkout** - Stripe-hosted checkout page
✅ **Subscription Management** - Auto-renewal, cancellation
✅ **Webhook Events** - Real-time status updates
✅ **Test Mode** - Full testing without real charges
✅ **Customer Portal** - Users can manage subscriptions
✅ **Multiple Plans** - Monthly and yearly options
✅ **Automatic Tax** - Stripe Tax (optional, enable in dashboard)

## Troubleshooting

**"Stripe not configured"** → Check that env variables are set and keys start with `pk_`

**Checkout fails silently** → Check browser console, verify Edge Function is deployed

**Webhook not working** → Verify signing secret is correct and events are selected

**Subscription not activating** → Check Supabase logs for webhook errors

## Customer Support Flow

Users can manage subscriptions via Stripe Customer Portal:
- View invoices
- Update payment method
- Cancel subscription
- Download receipts

## Revenue Dashboard

View all your revenue data in [Stripe Dashboard](https://dashboard.stripe.com/):
- MRR (Monthly Recurring Revenue)
- Churn rate
- Active subscriptions
- Payment analytics

## Costs

**Stripe fees (per transaction):**
- 2.9% + $0.30 for US cards
- No monthly fees
- No setup fees

**Example:** $4.99 monthly plan = $0.44 fee → You keep $4.55 (91%)

---

**Need help?** Check [Stripe Docs](https://stripe.com/docs) or [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
