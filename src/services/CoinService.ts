
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateCoinOptions {
  userId: string;
  amount: number;
  action?: string;
}

/**
 * Service for handling coin-related operations with Supabase
 */
export const CoinService = {
  /**
   * Updates a user's coin balance atomically using RPC
   * This ensures no race conditions when multiple updates happen
   */
  async updateUserCoins({ userId, amount, action = 'quiz_game' }: UpdateCoinOptions): Promise<{ success: boolean; error: Error | null }> {
    try {
      if (!userId) {
        throw new Error('User ID is required to update coins');
      }
      
      // For users with Supabase accounts, update via profiles table
      const { error } = await supabase.rpc('update_user_coins', {
        user_id: userId,
        coin_amount: amount
      });

      if (error) throw error;
      
      // Log the transaction in the rewards table for tracking
      await supabase.from('rewards').insert({
        user_id: userId,
        coins: amount,
        action: action
      });
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating coins:', error);
      return { success: false, error: error as Error };
    }
  },
  
  /**
   * Get user's current coin balance
   */
  async getUserCoins(userId: string): Promise<number | null> {
    try {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return data?.coins || 0;
    } catch (error) {
      console.error('Error fetching user coins:', error);
      return null;
    }
  }
};
