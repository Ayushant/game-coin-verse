
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { Users, ShoppingBag, CircleDollarSign, CreditCard } from 'lucide-react';

const AdminDashboard = () => {
  const { isAdmin } = useAdmin();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApps: 0,
    totalWithdrawals: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total apps
      const { count: appCount } = await supabase
        .from('paid_apps')
        .select('*', { count: 'exact', head: true });

      // Total withdrawals
      const { count: withdrawalCount } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true });

      // Pending payments
      const { count: pendingPaymentCount } = await supabase
        .from('manual_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers: userCount || 0,
        totalApps: appCount || 0,
        totalWithdrawals: withdrawalCount || 0,
        pendingPayments: pendingPaymentCount || 0,
      });
    };

    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="h-6 w-6 text-blue-500" />,
      color: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Apps Published",
      value: stats.totalApps,
      icon: <ShoppingBag className="h-6 w-6 text-emerald-500" />,
      color: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Total Withdrawals",
      value: stats.totalWithdrawals,
      icon: <CircleDollarSign className="h-6 w-6 text-amber-500" />,
      color: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments,
      icon: <CreditCard className="h-6 w-6 text-rose-500" />,
      color: "bg-rose-50 dark:bg-rose-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your gaming platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">View and manage recent withdrawal requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Review and process recent payment requests</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
