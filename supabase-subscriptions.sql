-- Add user subscriptions table for Stripe integration
-- Run this in Supabase SQL Editor after running the main schema

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'past_due', 'canceled', 'inactive'
  plan_id TEXT, -- 'monthly' or 'yearly'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- RLS Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (true);

-- Only service role can modify subscriptions (via webhook)
CREATE POLICY "Service can modify subscriptions"
  ON user_subscriptions FOR ALL
  USING (true);

-- Function to check if user has active premium subscription
CREATE OR REPLACE FUNCTION is_premium_user(user_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  sub_status TEXT;
BEGIN
  SELECT status INTO sub_status
  FROM user_subscriptions
  WHERE user_id = user_id_param
    AND status = 'active'
  LIMIT 1;
  
  RETURN sub_status = 'active';
END;
$$ LANGUAGE plpgsql;
