
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { Users, ShoppingBag, CreditCard, CircleDollarSign } from 'lucide-react';

interface DashboardStats {
  userCount: number;
  appCount: number;
  pendingPayments: number;
  pendingWithdrawals: number;
  totalCoins: number;
}

const AdminDashboard = () => {
  const { isAdmin } = useAdmin();
  const [stats, setStats] = useState<DashboardStats>({
    userCount: 0,
    appCount: 0,
    pendingPayments: 0,
    pendingWithdrawals: 0,
    totalCoins: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Get user count
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (userError) throw userError;
      
      // Get app count
      const { count: appCount, error: appError } = await supabase
        .from('paid_apps')
        .select('*', { count: 'exact', head: true });
      
      if (appError) throw appError;
      
      // Get pending payments
      const { count: pendingPayments, error: paymentError } = await supabase
        .from('manual_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (paymentError) throw paymentError;
      
      // Get pending withdrawals
      const { count: pendingWithdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (withdrawalError) throw withdrawalError;
      
      // Calculate total coins (sum of all user coins)
      const { data: coinsData, error: coinsError } = await supabase
        .from('profiles')
        .select('coins');
      
      if (coinsError) throw coinsError;
      
      const totalCoins = coinsData.reduce((sum, user) => sum + (user.coins || 0), 0);
      
      setStats({
        userCount: userCount || 0,
        appCount: appCount || 0,
        pendingPayments: pendingPayments || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        totalCoins
      });
      
    } catch (error) {
      console.error('Error loading admin stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Total Users" 
          value={stats.userCount.toString()} 
          icon={<Users className="h-5 w-5" />} 
          loading={loading}
        />
        <StatsCard 
          title="Apps Published" 
          value={stats.appCount.toString()} 
          icon={<ShoppingBag className="h-5 w-5" />} 
          loading={loading}
        />
        <StatsCard 
          title="Pending Payments" 
          value={stats.pendingPayments.toString()} 
          icon={<CreditCard className="h-5 w-5" />} 
          loading={loading}
          highlight={stats.pendingPayments > 0}
        />
        <StatsCard 
          title="Pending Withdrawals" 
          value={stats.pendingWithdrawals.toString()} 
          icon={<CircleDollarSign className="h-5 w-5" />} 
          loading={loading}
          highlight={stats.pendingWithdrawals > 0}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Coins in Circulation</p>
              <p className="text-2xl font-bold">{loading ? '...' : stats.totalCoins.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
  highlight?: boolean;
}

const StatsCard = ({ title, value, icon, loading = false, highlight = false }: StatsCardProps) => {
  return (
    <Card className={highlight ? "border-yellow-400 dark:border-yellow-600" : undefined}>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{loading ? '...' : value}</p>
        </div>
        <div className="bg-primary/10 p-2 rounded-full">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
