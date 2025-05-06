
import { NavLink } from 'react-router-dom';
import { Home, Gamepad, Wallet, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BottomNavBar = () => {
  const { user } = useAuth();
  
  // Don't show the navbar if the user is not logged in or not a guest
  if (!user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around bg-white/80 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 max-w-lg mx-auto">
      <NavLink to="/" className={({ isActive }) => 
        `flex flex-col items-center ${isActive ? 'text-game-purple' : 'text-gray-500 dark:text-gray-400'}`
      } end>
        <Home className="h-6 w-6" />
        <span className="text-xs mt-1">Home</span>
      </NavLink>
      
      <NavLink to="/games" className={({ isActive }) => 
        `flex flex-col items-center ${isActive ? 'text-game-purple' : 'text-gray-500 dark:text-gray-400'}`
      }>
        <Gamepad className="h-6 w-6" />
        <span className="text-xs mt-1">Games</span>
      </NavLink>
      
      <NavLink to="/wallet" className={({ isActive }) => 
        `flex flex-col items-center ${isActive ? 'text-game-purple' : 'text-gray-500 dark:text-gray-400'}`
      }>
        <Wallet className="h-6 w-6" />
        <span className="text-xs mt-1">Wallet</span>
      </NavLink>
      
      <NavLink to="/profile" className={({ isActive }) => 
        `flex flex-col items-center ${isActive ? 'text-game-purple' : 'text-gray-500 dark:text-gray-400'}`
      }>
        <User className="h-6 w-6" />
        <span className="text-xs mt-1">Profile</span>
      </NavLink>
      
      <NavLink to="/settings" className={({ isActive }) => 
        `flex flex-col items-center ${isActive ? 'text-game-purple' : 'text-gray-500 dark:text-gray-400'}`
      }>
        <Settings className="h-6 w-6" />
        <span className="text-xs mt-1">Settings</span>
      </NavLink>
    </div>
  );
};

export default BottomNavBar;
