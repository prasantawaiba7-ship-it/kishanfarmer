-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'monthly', 'yearly');

-- Create subscription status enum  
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  queries_used INTEGER NOT NULL DEFAULT 0,
  queries_limit INTEGER NOT NULL DEFAULT 3,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscription record
CREATE POLICY "Users can create own subscription"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription (for query count)
CREATE POLICY "Users can update own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user can query (has remaining queries or paid plan)
CREATE OR REPLACE FUNCTION public.can_user_query(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  SELECT * INTO v_subscription FROM user_subscriptions WHERE user_id = p_user_id;
  
  -- No subscription record, create one
  IF v_subscription IS NULL THEN
    INSERT INTO user_subscriptions (user_id, plan, queries_used, queries_limit)
    VALUES (p_user_id, 'free', 0, 3);
    RETURN TRUE;
  END IF;
  
  -- Paid plan with active status
  IF v_subscription.plan IN ('monthly', 'yearly') AND v_subscription.status = 'active' THEN
    RETURN TRUE;
  END IF;
  
  -- Free plan - check query limit
  IF v_subscription.queries_used < v_subscription.queries_limit THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to increment query count
CREATE OR REPLACE FUNCTION public.increment_query_count(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_subscriptions 
  SET queries_used = queries_used + 1
  WHERE user_id = p_user_id;
  
  -- If no row updated, create one
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (user_id, plan, queries_used, queries_limit)
    VALUES (p_user_id, 'free', 1, 3);
  END IF;
END;
$$;