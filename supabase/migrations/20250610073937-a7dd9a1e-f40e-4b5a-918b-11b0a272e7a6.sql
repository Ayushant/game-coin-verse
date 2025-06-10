
-- Add new columns to existing profiles table for subscription tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_earned NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_withdrawn BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'basic', 'premium')),
ADD COLUMN IF NOT EXISTS subscription_end DATE;

-- Create transactions table for tracking all earnings and withdrawals
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'withdrawal', 'bonus', 'game')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subscriptions table for managing subscription history
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium')),
    amount NUMERIC NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on new tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update profile's total_earned when transactions are added
CREATE OR REPLACE FUNCTION update_profile_earnings()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'earn' OR NEW.type = 'game' OR NEW.type = 'bonus' THEN
        UPDATE public.profiles 
        SET total_earned = total_earned + NEW.amount,
            updated_at = now()
        WHERE id = NEW.user_id;
    ELSIF NEW.type = 'withdrawal' THEN
        UPDATE public.profiles 
        SET has_withdrawn = true,
            updated_at = now()
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for the function
DROP TRIGGER IF EXISTS update_earnings_trigger ON public.transactions;
CREATE TRIGGER update_earnings_trigger
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_earnings();

-- Create function to check if user should be prompted for subscription
CREATE OR REPLACE FUNCTION check_subscription_required(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    user_profile RECORD;
BEGIN
    SELECT total_earned, has_withdrawn, subscription_status, subscription_end
    INTO user_profile
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- If user doesn't exist or already has active subscription, return false
    IF user_profile IS NULL OR user_profile.subscription_status != 'free' THEN
        RETURN false;
    END IF;
    
    -- Check if subscription is expired
    IF user_profile.subscription_end IS NOT NULL AND user_profile.subscription_end < CURRENT_DATE THEN
        UPDATE public.profiles 
        SET subscription_status = 'free', subscription_end = NULL
        WHERE id = p_user_id;
        RETURN true;
    END IF;
    
    -- Check if user has earned ₹40 or has withdrawn
    RETURN (user_profile.total_earned >= 40 OR user_profile.has_withdrawn = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status(
    p_user_id uuid,
    p_plan text,
    p_amount numeric,
    p_duration_months integer DEFAULT 1
)
RETURNS void AS $$
DECLARE
    end_date DATE;
BEGIN
    -- Calculate end date
    end_date := CURRENT_DATE + (p_duration_months || ' months')::interval;
    
    -- Update user profile
    UPDATE public.profiles 
    SET subscription_status = p_plan,
        subscription_end = end_date,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Insert subscription record
    INSERT INTO public.subscriptions (user_id, plan, amount, end_date)
    VALUES (p_user_id, p_plan, p_amount, end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
