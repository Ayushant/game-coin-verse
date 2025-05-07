
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Gamepad2, Wallet, User, Store } from 'lucide-react';

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      label: 'Home',
      icon: <Home size={24} />,
      path: '/',
    },
    {
      label: 'Games',
      icon: <Gamepad2 size={24} />,
      path: '/games',
    },
    {
      label: 'Store',
      icon: <Store size={24} />,
      path: '/store',
    },
    {
      label: 'Wallet',
      icon: <Wallet size={24} />,
      path: '/wallet',
    },
    {
      label: 'Profile',
      icon: <User size={24} />,
      path: '/profile',
    },
  ];

  // Don't show bottom navigation on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // Don't show if not logged in
  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = 
              location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.path}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center py-3',
                  isActive 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                )}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNavBar;
