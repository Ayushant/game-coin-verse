
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Wallet, ArrowRight, Download, Coins, CircleDollarSign, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
};

type Purchase = {
  id: string;
  app_name: string;
  payment_type: string;
  purchased_at: string;
};

const WalletPage = () => {
  const { user } = useAuth();
  const { getConversionRateInINR } = useAdmin();
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  useEffect(() => {
    if (user && !user.isGuest) {
      loadRecentWithdrawals();
      loadRecentPurchases();
    } else {
      setLoadingWithdrawals(false);
      setLoadingPurchases(false);
    }
  }, [user]);

  const loadRecentWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('id, amount, status, requested_at')
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      setRecentWithdrawals(data || []);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const loadRecentPurchases = async () => {
    try {
      setLoadingPurchases(true);
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id, 
          payment_type,
          created_at,
          paid_apps:app_id (name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      const formattedPurchases = data.map(item => ({
        id: item.id,
        app_name: item.paid_apps?.name || 'Unknown App',
        payment_type: item.payment_type,
        purchased_at: item.created_at,
      }));
      
      setRecentPurchases(formattedPurchases);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Your Wallet</h1>
      
      <div className="bg-gradient-to-r from-game-purple to-game-purple-dark rounded-xl p-5 mb-6 shadow-lg relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 opacity-10">
          <Coins className="w-40 h-40 -mt-8 -mr-8" />
        </div>
        <div className="flex items-center mb-4">
          <Wallet className="h-6 w-6 mr-2" />
          <h2 className="text-xl font-semibold">Your Balance</h2>
        </div>
        <div className="mb-2">
          <p className="text-3xl font-bold">{user?.coins || 0}</p>
          <p className="text-sm opacity-80">Coins</p>
        </div>
        <div className="mt-4">
          {user?.isGuest ? (
            <p className="text-xs opacity-80">Sign up to withdraw coins</p>
          ) : (
            <p className="text-xs opacity-80">
              Estimated value: ₹{getConversionRateInINR(user?.coins || 0)}
            </p>
          )}
        </div>
        <div className="mt-5 space-x-3">
          {!user?.isGuest && (
            <Button 
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white"
              asChild
            >
              <Link to="/withdraw">
                Withdraw <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Withdrawals</CardTitle>
            <CardDescription>Your recent withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWithdrawals ? (
              <p className="text-center py-4 text-muted-foreground">Loading...</p>
            ) : recentWithdrawals.length > 0 ? (
              <ul className="space-y-3">
                {recentWithdrawals.map((withdrawal) => (
                  <li key={withdrawal.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">₹{withdrawal.amount}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(withdrawal.requested_at)}</p>
                    </div>
                    <span className={`capitalize ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                {user?.isGuest 
                  ? "Sign up to withdraw coins" 
                  : "No withdrawal history"}
              </p>
            )}
          </CardContent>
          <CardFooter>
            {!user?.isGuest && (
              <Button asChild variant="outline" className="w-full">
                <Link to="/withdraw">
                  <CircleDollarSign className="w-4 h-4 mr-2" /> 
                  Withdraw Funds
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
            <CardDescription>Your recent app purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPurchases ? (
              <p className="text-center py-4 text-muted-foreground">Loading...</p>
            ) : recentPurchases.length > 0 ? (
              <ul className="space-y-3">
                {recentPurchases.map((purchase) => (
                  <li key={purchase.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{purchase.app_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(purchase.purchased_at)}</p>
                    </div>
                    <span className="capitalize text-sm">
                      {purchase.payment_type}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No purchase history</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/store">
                <Store className="w-4 h-4 mr-2" /> 
                Visit App Store
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;
