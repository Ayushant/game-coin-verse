
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Star, Award, Medal, LogOut } from 'lucide-react';
import CoinDisplay from '@/components/ui/CoinDisplay';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no user
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <CoinDisplay />
      </div>

      <Card className="game-card p-6 mb-6">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-gradient-game rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.isGuest ? 'G' : (user.email?.charAt(0).toUpperCase() || 'U')}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold">
              {user.isGuest ? 'Guest User' : (user.email?.split('@')[0] || 'User')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {user.isGuest ? 'Playing as guest' : user.email}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold">{user.coins}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Coins</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold">2</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Games Played</div>
          </div>
        </div>
        
        {user.isGuest && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-400 mb-1">Playing as Guest</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-500">Sign up to save your progress and coins permanently.</p>
            <div className="mt-3 flex gap-2">
              <Button
                className="bg-yellow-500 hover:bg-yellow-600" 
                onClick={() => navigate('/register')}
              >
                Sign Up
              </Button>
              <Button 
                variant="outline" 
                className="border-yellow-500 text-yellow-800 dark:text-yellow-400" 
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            </div>
          </div>
        )}
        
        {!user.isGuest && (
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        )}
      </Card>
      
      <h2 className="text-xl font-semibold text-white mb-4">Achievements</h2>
      
      <Card className="game-card p-4">
        <div className="grid grid-cols-2 gap-4">
          <Achievement 
            icon={<Trophy className="h-6 w-6 text-game-gold" />}
            title="First Win"
            description="Win your first game"
            completed
          />
          <Achievement 
            icon={<Star className="h-6 w-6 text-purple-500" />}
            title="Collector"
            description="Earn 100 coins"
            completed={user.coins >= 100}
          />
          <Achievement 
            icon={<Award className="h-6 w-6 text-blue-500" />}
            title="Skilled Player"
            description="Win 5 games in a row"
            completed={false}
          />
          <Achievement 
            icon={<Medal className="h-6 w-6 text-green-500" />}
            title="Daily Grind"
            description="Login 7 days in a row"
            completed={false}
            progress={3}
          />
        </div>
      </Card>
    </div>
  );
};

interface AchievementProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  completed: boolean;
  progress?: number;
}

const Achievement = ({ icon, title, description, completed, progress }: AchievementProps) => {
  return (
    <div className={`p-3 rounded-lg border ${completed ? 'border-game-gold bg-game-gold/10' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center mb-2">
        {icon}
        <div className={`ml-2 text-sm font-medium ${completed ? 'text-game-gold-dark' : ''}`}>
          {title}
        </div>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      
      {progress !== undefined && (
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div 
            className="bg-green-500 h-1.5 rounded-full" 
            style={{ width: `${(progress / 7) * 100}%` }} 
          />
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
