
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Define types for our context
interface AdminContextType {
  isAdmin: boolean;
  loading: boolean;
  conversionRate: number;
  updateConversionRate: (rate: number) => Promise<void>;
  getConversionRateInINR: (coins: number) => number;
  getCoinsFromINR: (inr: number) => number;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(true); // Set to true by default for hardcoded admin credentials
  const [loading, setLoading] = useState<boolean>(false);
  const [conversionRate, setConversionRate] = useState<number>(100); // Default: 100 coins = 1 INR
  const { toast } = useToast();

  // Load conversion rate from settings
  useEffect(() => {
    const loadConversionRate = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" error, which is fine if no settings yet
          console.error('Error fetching conversion rate:', error);
        }

        if (data) {
          setConversionRate(data.coins_to_inr);
        }
      } catch (error) {
        console.error('Error loading conversion rate:', error);
      }
    };

    loadConversionRate();
  }, []);

  // Update the conversion rate
  const updateConversionRate = async (rate: number) => {
    try {
      const { error } = await supabase
        .from('settings')
        .insert({
          coins_to_inr: rate,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setConversionRate(rate);
      
      toast({
        title: 'Conversion rate updated',
        description: `New rate: ${rate} coins = ₹1`,
      });
      
    } catch (error) {
      console.error('Error updating conversion rate:', error);
      
      toast({
        title: 'Update failed',
        description: 'Failed to update conversion rate',
        variant: 'destructive',
      });
    }
  };

  // Convert coins to INR
  const getConversionRateInINR = (coins: number): number => {
    return Number((coins / conversionRate).toFixed(2));
  };

  // Convert INR to coins
  const getCoinsFromINR = (inr: number): number => {
    return Math.floor(inr * conversionRate);
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        loading,
        conversionRate,
        updateConversionRate,
        getConversionRateInINR,
        getCoinsFromINR
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
