import { loadStripe } from '@stripe/stripe-js';

// Stripe public key (get from Stripe dashboard)
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';

// Initialize Stripe
let stripePromise;
export const getStripe = () => {
  if (!stripePromise && STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Check if Stripe is configured
export const isStripeConfigured = () => {
  return STRIPE_PUBLIC_KEY && STRIPE_PUBLIC_KEY.startsWith('pk_');
};

// Pricing plans
export const PRICING_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 4.99,
    interval: 'month',
    priceId: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
    features: [
      'Advanced Analytics',
      'Peak Hour Alerts',
      'Apple Health Sync',
      'Weekly Forecasts',
      'Consistency Score',
      'Export Workout Data',
      'Ad-free Experience'
    ]
  },
  yearly: {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 49.99,
    interval: 'year',
    priceId: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder',
    savings: '17% off',
    features: [
      'All Monthly Features',
      'Save $10/year',
      'Priority Support',
      'Early Access to Features'
    ]
  }
};

/**
 * Create Stripe checkout session
 * In production, this should call your backend to create the session
 */
export async function createCheckoutSession(priceId, userId) {
  if (!isStripeConfigured()) {
    throw new Error('Stripe not configured');
  }

  // In production, this would be a backend API call
  // For now, we'll simulate the flow
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      userId,
      successUrl: `${window.location.origin}?success=true`,
      cancelUrl: `${window.location.origin}?canceled=true`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const session = await response.json();
  return session;
}

/**
 * Redirect to Stripe Checkout
 */
export async function redirectToCheckout(priceId, userId) {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    // Create checkout session via backend
    const session = await createCheckoutSession(priceId, userId);

    // Redirect to Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
}

/**
 * Create customer portal session (for managing subscriptions)
 */
export async function createPortalSession(customerId) {
  const response = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      returnUrl: window.location.origin,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create portal session');
  }

  const session = await response.json();
  window.location.href = session.url;
}

/**
 * Mock checkout for development (when Stripe not configured)
 */
export async function mockCheckout(planId, userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate successful payment
      console.log(`Mock checkout completed for ${planId}, user: ${userId}`);
      resolve({ success: true, planId, userId });
    }, 1500);
  });
}

export default {
  getStripe,
  isStripeConfigured,
  PRICING_PLANS,
  redirectToCheckout,
  createPortalSession,
  mockCheckout,
};
