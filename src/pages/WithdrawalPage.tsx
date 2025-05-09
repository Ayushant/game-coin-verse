
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDown, Clock, Wallet, RefreshCw } from 'lucide-react';
import CoinDisplay from '@/components/ui/CoinDisplay';

interface Withdrawal {
  id: string;
  amount: number;
  coins_spent: number;
  payment_detail: string;
  status: string;
  requested_at: string;
  processed_at?: string;
  method: string;
  user_id: string;
}

const WithdrawalPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getConversionRateInINR } = useAdmin();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  
  // Exchange rate: 1000 coins = ₹10
  const coinToRupeeRate = 0.01;
  
  // Fetch withdrawal history from Supabase
  const fetchWithdrawals = async () => {
    if (!user || user.isGuest) return;
    
    try {
      setIsRefreshing(true);
      console.log('Fetching withdrawals for user:', user.id);
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching withdrawals:', error);
        throw error;
      }
      
      if (data) {
        console.log('Withdrawals fetched:', data.length);
        setWithdrawals(data as Withdrawal[]);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch withdrawal history',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Process withdrawal request
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "Please log in to withdraw coins",
        variant: "destructive",
      });
      return;
    }
    
    const coinAmount = parseInt(amount);
    
    // Validate withdrawal amount
    if (isNaN(coinAmount) || coinAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid coin amount",
        variant: "destructive",
      });
      return;
    }
    
    // Minimum withdrawal amount (500 coins)
    const minCoins = 500;
    if (coinAmount < minCoins) {
      toast({
        title: "Minimum Withdrawal",
        description: `Minimum withdrawal amount is ${minCoins} coins (₹${getConversionRateInINR(minCoins)})`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has enough coins
    if (user.coins < coinAmount) {
      toast({
        title: "Insufficient Coins",
        description: "You don't have enough coins for this withdrawal",
        variant: "destructive",
      });
      return;
    }
    
    // Validate UPI ID
    if (!upiId || !upiId.includes('@')) {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID (e.g. yourname@upi)",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // For guest users, just simulate a withdrawal
      if (user.isGuest) {
        // Simulate withdrawal for guest users
        setTimeout(() => {
          toast({
            title: "Guest Mode",
            description: "Withdrawals are simulated in guest mode. Please sign up for real withdrawals.",
          });
          setIsLoading(false);
        }, 1000);
        return;
      }
      
      // Create withdrawal record in Supabase for registered users
      const rupeeAmount = getConversionRateInINR(coinAmount);
      const { data, error } = await supabase
        .from('withdrawals')
        .insert([
          {
            user_id: user.id,
            coins_spent: coinAmount,
            amount: rupeeAmount,
            payment_detail: upiId,
            method: 'upi',
            status: 'pending'
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Withdrawal Requested",
        description: `Your withdrawal request for ${coinAmount} coins (₹${rupeeAmount.toFixed(2)}) has been submitted`,
      });
      
      // Refresh withdrawal history
      fetchWithdrawals();
      setAmount('');
      setUpiId('');
      
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Withdrawal Failed",
        description: "There was a problem processing your withdrawal",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchWithdrawals();
  };
  
  // Load withdrawal history when component mounts
  useEffect(() => {
    if (user && !user.isGuest) {
      fetchWithdrawals();
    }
  }, [user]);
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Withdraw</h1>
        <CoinDisplay />
      </div>
      
      <Card className="game-card p-6 mb-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-gray-600 dark:text-gray-300">Available Balance</div>
          </div>
          
          <div className="flex items-center mb-6">
            <svg className="h-8 w-8 text-game-gold mr-3 animate-bounce-subtle" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="#FFA726" />
              <circle cx="12" cy="12" r="8" fill="#FFD54F" />
              <circle cx="12" cy="12" r="4" fill="#FFE082" />
            </svg>
            <div>
              <h2 className="text-4xl font-bold">{user.coins}</h2>
              <p className="text-sm text-gray-500">≈ ₹{getConversionRateInINR(user.coins).toFixed(2)}</p>
            </div>
          </div>
          
          <form onSubmit={handleWithdrawal} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (in coins)</Label>
              <Input 
                id="amount" 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Minimum 500 coins"
                className="mt-1"
                required
              />
              {amount && (
                <p className="text-xs text-gray-500 mt-1">
                  ≈ ₹{getConversionRateInINR(parseInt(amount || '0')).toFixed(2)}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="upi-id">UPI ID</Label>
              <Input 
                id="upi-id" 
                type="text" 
                value={upiId} 
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="mt-1"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-game flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <ArrowDown className="h-4 w-4" />
              {isLoading ? 'Processing...' : 'Withdraw'}
            </Button>
            
            {user.isGuest && (
              <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500 rounded-md text-sm text-yellow-800 dark:text-yellow-400">
                <p>⚠️ You're in guest mode. Sign up for real withdrawals.</p>
              </div>
            )}
          </form>
        </div>
      </Card>
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Withdrawal History</h2>
        {!user.isGuest && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>
      
      <Card className="game-card p-4">
        <div className="space-y-3">
          {user.isGuest ? (
            <p className="text-center py-6 text-gray-500">Sign up to access withdrawal history</p>
          ) : isRefreshing ? (
            <div className="flex justify-center items-center py-6">
              <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-500">Refreshing...</span>
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="text-center py-6 text-gray-500">No withdrawal history yet</p>
          ) : (
            withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-none pb-2 last:pb-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 text-purple-500 dark:bg-purple-900/30 dark:text-purple-400">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">
                      UPI Withdrawal
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(withdrawal.requested_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-lg font-semibold text-red-500">
                    -{withdrawal.coins_spent}
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${
                    withdrawal.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                    withdrawal.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {withdrawal.status === 'completed' ? 'Completed' : 
                     withdrawal.status === 'failed' ? 'Failed' : 'Pending'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default WithdrawalPage;
