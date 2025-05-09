
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Gift, Target, Calendar, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import CoinDisplay from '@/components/ui/CoinDisplay';
import SpinWheel from '@/components/games/SpinWheel';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no user
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">WinWitty</h1>
          <p className="text-white/80">
            {user.isGuest ? 'Guest User' : user.email || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CoinDisplay />
          <Bell className="h-6 w-6 text-white cursor-pointer" />
        </div>
      </div>

      {/* Daily Bonus & Missions */}
      <Card className="game-card p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="game-card-header flex items-center">
            <Gift className="mr-2 h-5 w-5" />
            Daily Bonus & Missions
          </h2>
          <button className="bg-game-gold text-white px-3 py-1 rounded-full text-sm font-bold">
            GO
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
          Earn more coins by completing missions
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Target className="h-4 w-4 mr-2 text-game-purple" />
              <span className="text-sm">Daily login</span>
            </div>
            <span className="text-game-gold text-sm font-medium">+10 coins</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-game-purple" />
              <span className="text-sm">Play 3 games</span>
            </div>
            <span className="text-game-gold text-sm font-medium">+15 coins</span>
          </div>
        </div>
      </Card>

      {/* Spin Wheel */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <SpinWheel />
        </div>
      </div>

      {/* Play Games */}
      <Card className="game-card p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="game-card-header flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Play Games
          </h2>
          <button 
            className="text-game-purple text-sm font-bold"
            onClick={() => navigate('/games')}
          >
            See all
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <GamePreview 
            title="Tic Tac Toe" 
            coins={5} 
            onClick={() => navigate('/games/tictactoe')} 
          />
          <GamePreview 
            title="2048" 
            coins={10} 
            onClick={() => navigate('/games/2048')} 
          />
        </div>
      </Card>

      {/* Download Apps */}
      <Card className="game-card p-4 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="game-card-header">Download Apps</h3>
          <span className="text-xs text-game-gold font-medium">+100 coins</span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Download apps to earn more coins
        </p>
      </Card>
    </div>
  );
};

interface GamePreviewProps {
  title: string;
  coins: number;
  onClick: () => void;
}

const GamePreview = ({ title, coins, onClick }: GamePreviewProps) => {
  return (
    <div 
      className="flex-shrink-0 w-24 cursor-pointer transition-transform hover:scale-105"
      onClick={onClick}
    >
      <div className="bg-game-purple/20 h-24 w-24 rounded-lg mb-2 flex items-center justify-center shadow-md">
        {title === 'Tic Tac Toe' ? (
          <svg className="h-12 w-12 text-game-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
          </svg>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            <div className="h-5 w-5 bg-game-purple-light rounded-sm flex items-center justify-center text-white text-xs">2</div>
            <div className="h-5 w-5 bg-game-purple rounded-sm flex items-center justify-center text-white text-xs">4</div>
            <div className="h-5 w-5 bg-game-purple-dark rounded-sm flex items-center justify-center text-white text-xs">8</div>
            <div className="h-5 w-5 bg-game-gold rounded-sm flex items-center justify-center text-white text-xs">16</div>
          </div>
        )}
      </div>
      <h4 className="text-sm font-medium text-center">{title}</h4>
      <div className="flex justify-center items-center mt-1">
        <svg className="h-3 w-3 text-game-gold mr-1" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span className="text-xs text-game-gold">{coins}</span>
      </div>
    </div>
  );
};

export default Dashboard;
