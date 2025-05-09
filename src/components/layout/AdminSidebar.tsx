
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  CircleDollarSign,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/contexts/AdminContext';

const AdminSidebar = () => {
  const location = useLocation();

  const navItems = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/admin',
    },
    {
      title: 'Users',
      icon: <Users className="w-5 h-5" />,
      href: '/admin/users',
    },
    {
      title: 'Apps',
      icon: <ShoppingBag className="w-5 h-5" />,
      href: '/admin/apps',
    },
    {
      title: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
      href: '/admin/payments',
    },
    {
      title: 'Withdrawals',
      icon: <CircleDollarSign className="w-5 h-5" />,
      href: '/admin/withdrawals',
    },
    {
      title: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      href: '/admin/settings',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 px-3 py-4 md:py-6 border-r border-gray-200 dark:border-gray-800 h-[calc(100vh-4rem)] sticky top-0 overflow-y-auto">
      <div className="text-xl font-bold text-center mb-6 text-primary">Admin Panel</div>
      <nav className="space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center px-2 py-2.5 text-sm rounded-lg transition-all',
                isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <span className={cn(
                'mr-3',
                isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
              )}>
                {item.icon}
              </span>
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;
