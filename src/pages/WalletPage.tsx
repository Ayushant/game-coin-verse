
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, ArrowDown, Clock } from 'lucide-react';

const WalletPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no user
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const transactions = [
    { id: 1, type: 'earn', amount: 5, source: 'Tic Tac Toe win', time: '2 hours ago' },
    { id: 2, type: 'earn', amount: 10, source: '2048 game', time: '4 hours ago' },
    { id: 3, type: 'earn', amount: 10, source: 'Daily login', time: '1 day ago' },
    { id: 4, type: 'spend', amount: 15, source: 'Scratch card', time: '2 days ago' },
  ];

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
          {transactions.map((transaction) => (
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
          ))}
        </div>
      </Card>
    </div>
  );
};

export default WalletPage;
