
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionContextType {
  subscriptionRequired: boolean;
  checkSubscriptionStatus: () => Promise<void>;
  purchaseSubscription: (plan: 'basic' | 'premium') => Promise<boolean>;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkSubscriptionStatus = async () => {
    if (!user || user.isGuest) {
      setSubscriptionRequired(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_subscription_required', {
        p_user_id: user.id
      });

      if (error) throw error;
      
      setSubscriptionRequired(data || false);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const purchaseSubscription = async (plan: 'basic' | 'premium'): Promise<boolean> => {
    if (!user || user.isGuest) {
      toast({
        title: 'Account Required',
        description: 'Please create an account to purchase a subscription.',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    
    try {
      const amount = plan === 'basic' ? 19 : 49;
      
      // Call the update subscription function
      const { error } = await supabase.rpc('update_subscription_status', {
        p_user_id: user.id,
        p_plan: plan,
        p_amount: amount,
        p_duration_months: 1
      });

      if (error) throw error;

      // Create a transaction record
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: -amount, // Negative because it's a payment
        type: 'withdrawal',
        description: `${plan} subscription purchase`
      });

      toast({
        title: 'Subscription Activated!',
        description: `Your ${plan} plan is now active for 30 days.`,
      });

      setSubscriptionRequired(false);
      return true;
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      toast({
        title: 'Purchase Failed',
        description: 'There was an error processing your subscription. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !user.isGuest) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const value = {
    subscriptionRequired,
    checkSubscriptionStatus,
    purchaseSubscription,
    loading,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
