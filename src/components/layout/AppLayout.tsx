
import { ReactNode } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import BottomNavBar from './BottomNavBar';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children?: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: adminLoading, isAdmin } = useAdmin();
  const location = useLocation();
  
  const isAdminRoute = location.pathname.startsWith('/admin');
  const loading = authLoading || adminLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-game-purple to-game-purple-dark text-white">
        <Loader2 className="h-10 w-10 animate-spin" />
        <span className="ml-2 text-xl">Loading...</span>
      </div>
    );
  }

  // Handle admin route access specifically for project75database75@gmail.com
  if (isAdminRoute) {
    if (!user) {
      // Redirect to login if not authenticated
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    if (!isAdmin) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-game-purple to-game-purple-dark text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You do not have permission to access this page.</p>
          <a href="/" className="game-button">Return to Home</a>
        </div>
      );
    }

    return (
      <div className="flex h-screen max-w-none mx-auto">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            {children || <Outlet />}
          </div>
        </div>
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
