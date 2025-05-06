
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Grid3X3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CoinDisplay from '@/components/ui/CoinDisplay';

const GamesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no user
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const games = [
    { 
      id: 'tictactoe',
      name: 'Tic Tac Toe', 
      description: 'Classic game of X and O', 
      reward: 5,
      color: 'from-purple-500 to-indigo-600',
      icon: (
        <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
      )
    },
    { 
      id: '2048',
      name: '2048', 
      description: 'Merge tiles to reach 2048', 
      reward: 10,
      color: 'from-amber-500 to-orange-600',
      icon: (
        <div className="grid grid-cols-2 gap-1">
          <div className="h-5 w-5 bg-white/90 rounded-sm flex items-center justify-center text-amber-500 text-xs font-bold">2</div>
          <div className="h-5 w-5 bg-white/80 rounded-sm flex items-center justify-center text-amber-500 text-xs font-bold">4</div>
          <div className="h-5 w-5 bg-white/70 rounded-sm flex items-center justify-center text-amber-500 text-xs font-bold">8</div>
          <div className="h-5 w-5 bg-white/90 rounded-sm flex items-center justify-center text-amber-500 text-xs font-bold">16</div>
        </div>
      )
    },
    { 
      id: 'sudoku',
      name: 'Sudoku', 
      description: 'Fill the grid with numbers', 
      reward: 15,
      color: 'from-blue-500 to-blue-600',
      icon: (
        <Grid3X3 className="h-10 w-10 text-white" />
      )
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Games</h1>
        <CoinDisplay />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input 
          className="pl-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 rounded-xl shadow-md"
          placeholder="Search games..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {games.map((game) => (
          <div 
            key={game.id}
            className={`bg-gradient-to-br ${game.color} rounded-xl p-4 aspect-square shadow-lg flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform`}
            onClick={() => navigate(`/games/${game.id}`)}
          >
            <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm">
              {game.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{game.name}</h3>
              <p className="text-xs text-white/80">{game.description}</p>
              <div className="flex items-center mt-2">
                <svg className="h-4 w-4 text-game-gold mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span className="text-white text-sm">Win {game.reward} coins</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamesPage;
