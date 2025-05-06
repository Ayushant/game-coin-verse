
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Clock, Wallet } from 'lucide-react';
import CoinDisplay from '@/components/ui/CoinDisplay';

interface Withdrawal {
  id: string;
  amount: number;
  coins_spent: number;
  method: string;
  payment_detail: string;
  status: string;
  requested_at: string;
}

const WithdrawalPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentDetail, setPaymentDetail] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  
  // Exchange rate: 100 coins = ₹1
  const coinToRupeeRate = 0.01;
  
  // Fetch withdrawal history from Supabase
  const fetchWithdrawals = async () => {
    if (!user || user.isGuest) return;
    
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setWithdrawals(data as Withdrawal[]);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
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
    
    // Minimum withdrawal amount (500 coins = ₹5)
    if (coinAmount < 500) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is 500 coins (₹5)",
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
    
    // Validate payment details
    if (!paymentDetail) {
      toast({
        title: "Missing Payment Details",
        description: "Please enter your payment details",
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
      const rupeeAmount = coinAmount * coinToRupeeRate;
      const { data, error } = await supabase
        .from('withdrawals')
        .insert([
          {
            user_id: user.id,
            coins_spent: coinAmount,
            amount: rupeeAmount,
            method: paymentMethod,
            payment_detail: paymentDetail,
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
      setPaymentDetail('');
      
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
              <p className="text-sm text-gray-500">≈ ₹{(user.coins * coinToRupeeRate).toFixed(2)}</p>
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
                  ≈ ₹{(parseInt(amount || '0') * coinToRupeeRate).toFixed(2)}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="paytm">Paytm</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="payment-detail">
                {paymentMethod === 'upi' ? 'UPI ID' : 
                 paymentMethod === 'paytm' ? 'Paytm Number' : 
                 paymentMethod === 'bank' ? 'Bank Account Details' : 'PayPal Email'}
              </Label>
              <Input 
                id="payment-detail" 
                value={paymentDetail} 
                onChange={(e) => setPaymentDetail(e.target.value)}
                placeholder={
                  paymentMethod === 'upi' ? 'example@upi' : 
                  paymentMethod === 'paytm' ? '9876543210' : 
                  paymentMethod === 'bank' ? 'Account number, IFSC, Name' : 'email@example.com'
                }
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
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Withdrawal History</h2>
      </div>
      
      <Card className="game-card p-4">
        <div className="space-y-3">
          {user.isGuest ? (
            <p className="text-center py-6 text-gray-500">Sign up to access withdrawal history</p>
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
                      {withdrawal.method.toUpperCase()} Withdrawal
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
                    withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
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
