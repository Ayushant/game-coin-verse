
import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavBar from './BottomNavBar';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children?: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-game-purple to-game-purple-dark text-white">
        <Loader2 className="h-10 w-10 animate-spin" />
        <span className="ml-2 text-xl">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-game z-0"></div>
      <div className="relative z-10 pb-20 min-h-screen">
        {children || <Outlet />}
      </div>
      <BottomNavBar />
    </div>
  );
};

export default AppLayout;
