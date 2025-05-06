
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, ArrowDown, Clock } from 'lucide-react';

interface Transaction {
  id: number | string;
  type: 'earn' | 'spend';
  amount: number;
  source: string;
  time: string;
  timestamp?: Date;
}

const WalletPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Redirect to login if no user
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch transactions
    const fetchTransactions = async () => {
      if (user.isGuest) {
        // For guest users, use sample data
        setTransactions([
          { id: 1, type: 'earn', amount: 5, source: 'Tic Tac Toe win', time: '2 hours ago' },
          { id: 2, type: 'earn', amount: 10, source: '2048 game', time: '4 hours ago' },
          { id: 3, type: 'earn', amount: 10, source: 'Daily login', time: '1 day ago' },
          { id: 4, type: 'spend', amount: 15, source: 'Scratch card', time: '2 days ago' },
        ]);
        return;
      }

      setIsLoading(true);
      try {
        // Get game sessions for earnings
        const { data: gameSessions, error: gameError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('played_at', { ascending: false })
          .limit(10);

        if (gameError) throw gameError;

        // Get rewards for additional earnings
        const { data: rewards, error: rewardsError } = await supabase
          .from('rewards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (rewardsError) throw rewardsError;

        // Get withdrawals for spending
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .order('requested_at', { ascending: false })
          .limit(5);

        if (withdrawalsError) throw withdrawalsError;

        // Combine and format transactions
        const formattedGameSessions = gameSessions?.map(session => ({
          id: session.id,
          type: 'earn' as const,
          amount: session.coins_earned,
          source: `${session.game_name} game`,
          time: formatTime(new Date(session.played_at)),
          timestamp: new Date(session.played_at)
        })) || [];

        const formattedRewards = rewards?.map(reward => ({
          id: reward.id,
          type: 'earn' as const,
          amount: reward.coins,
          source: formatRewardSource(reward.action),
          time: formatTime(new Date(reward.created_at)),
          timestamp: new Date(reward.created_at)
        })) || [];

        const formattedWithdrawals = withdrawals?.map(withdrawal => ({
          id: withdrawal.id,
          type: 'spend' as const,
          amount: withdrawal.coins_spent,
          source: `${withdrawal.method.toUpperCase()} Withdrawal`,
          time: formatTime(new Date(withdrawal.requested_at)),
          timestamp: new Date(withdrawal.requested_at)
        })) || [];

        // Combine and sort all transactions by timestamp
        const allTransactions = [...formattedGameSessions, ...formattedRewards, ...formattedWithdrawals]
          .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
          .slice(0, 10); // Limit to 10 most recent

        setTransactions(allTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user, navigate]);

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return date.toLocaleDateString();
  };

  const formatRewardSource = (action: string): string => {
    const sourceMap: Record<string, string> = {
      'watch_ad': 'Watching ad',
      'daily_login': 'Daily login',
      'download_app': 'Downloading app',
      'spin_wheel': 'Spin wheel',
      'mission_complete': 'Mission completed',
      'scratch_card': 'Scratch card',
    };

    return sourceMap[action] || action.replace('_', ' ');
  };

  if (!user) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
      </div>

      <Card className="game-card p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-600 dark:text-gray-300">Balance</div>
          <div className="flex items-center">
            <TrendingUp className="text-green-500 mr-1 h-4 w-4" />
            <span className="text-green-500 text-xs">+15% this week</span>
          </div>
        </div>

        <div className="flex items-center mb-6">
          <svg className="h-8 w-8 text-game-gold mr-3 animate-bounce-subtle" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" fill="#FFA726" />
            <circle cx="12" cy="12" r="8" fill="#FFD54F" />
            <circle cx="12" cy="12" r="4" fill="#FFE082" />
          </svg>
          <h2 className="text-4xl font-bold">{user.coins}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="flex items-center justify-center gap-2 bg-gradient-game"
            onClick={() => navigate('/withdraw')}
          >
            <ArrowDown className="h-5 w-5" />
            Withdraw
          </Button>
          <Button className="flex items-center justify-center gap-2 bg-gradient-gold">
            <Coins className="h-5 w-5" />
            Get Coins
          </Button>
        </div>
      </Card>

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
      </div>

      <Card className="game-card p-4">
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto"></div>
              <p className="text-sm mt-2 text-gray-400">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-none pb-2 last:pb-0">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'earn' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'} dark:bg-opacity-20`}>
                    {transaction.type === 'earn' ? (
                      <Coins className="h-5 w-5" />
                    ) : (
                      <ArrowDown className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{transaction.source}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {transaction.time}
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-semibold ${transaction.type === 'earn' ? 'text-green-500' : 'text-red-500'}`}>
                  {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default WalletPage;
