
import { supabase } from '@/integrations/supabase/client';

interface CreateTransactionOptions {
  userId: string;
  amount: number;
  type: 'earn' | 'withdrawal' | 'bonus' | 'game';
  description?: string;
}

/**
 * Service for handling transaction-related operations with Supabase
 */
export const TransactionService = {
  /**
   * Creates a new transaction record
   */
  async createTransaction({ userId, amount, type, description }: CreateTransactionOptions): Promise<{ success: boolean; error: Error | null }> {
    try {
      if (!userId) {
        throw new Error('User ID is required to create a transaction');
      }
      
      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        amount: amount,
        type: type,
        description: description || `${type} transaction`
      });

      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return { success: false, error: error as Error };
    }
  },
  
  /**
   * Get user's transaction history
   */
  async getUserTransactions(userId: string, limit: number = 50): Promise<any[] | null> {
    try {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return null;
    }
  }
};
