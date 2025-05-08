
import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { ReactNode } from 'react';
import { Users, Search, Loader2, Plus, Minus } from 'lucide-react';
import { UserWithdrawal, UserPurchase, WithdrawalStatus } from '@/types/app';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  coins: number;
  is_guest: boolean;
  role: 'user' | 'admin';
  created_at: string;
}

const AdminUsers = () => {
  const { isAdmin } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userWithdrawals, setUserWithdrawals] = useState<UserWithdrawal[]>([]);
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coinAdjustment, setCoinAdjustment] = useState(0);
  const [adjustingCoins, setAdjustingCoins] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get profiles data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      
      // Fetch emails for each profile
      const formattedUsers: User[] = [];
      
      for (const profile of profilesData || []) {
        // Get user auth data for email
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          profile.id
        );
        
        formattedUsers.push({
          ...profile,
          email: userData?.user?.email || 'N/A'
        });
      }
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserWithdrawals = async (userId: string) => {
    try {
      setLoadingDetails(true);
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      
      // Ensure proper typing of the response
      const typedWithdrawals: UserWithdrawal[] = data.map(item => ({
        ...item,
        status: item.status as WithdrawalStatus
      }));
      
      setUserWithdrawals(typedWithdrawals);
    } catch (error) {
      console.error('Error loading user withdrawals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load withdrawal history',
        variant: 'destructive',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadUserPurchases = async (userId: string) => {
    try {
      setLoadingDetails(true);
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          paid_apps!inner(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedPurchases: UserPurchase[] = data.map(purchase => ({
        id: purchase.id,
        app_id: purchase.app_id,
        app_name: purchase.paid_apps?.name || 'Unknown App',
        payment_type: purchase.payment_type,
        created_at: purchase.created_at
      }));
      
      setUserPurchases(formattedPurchases);
    } catch (error) {
      console.error('Error loading user purchases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase history',
        variant: 'destructive',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    loadUserWithdrawals(user.id);
    loadUserPurchases(user.id);
    setDialogOpen(true);
  };

  const adjustUserCoins = async () => {
    if (!selectedUser || coinAdjustment === 0) return;
    
    try {
      setAdjustingCoins(true);
      
      // Update user's coins in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: selectedUser.coins + coinAdjustment })
        .eq('id', selectedUser.id);
      
      if (updateError) throw updateError;
      
      // Create a record in the rewards table
      const { error: rewardError } = await supabase
        .from('rewards')
        .insert({
          user_id: selectedUser.id,
          coins: coinAdjustment,
          action: 'admin_adjustment',
        });
      
      if (rewardError) throw rewardError;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id
          ? { ...user, coins: user.coins + coinAdjustment }
          : user
      ));
      
      setSelectedUser({
        ...selectedUser,
        coins: selectedUser.coins + coinAdjustment
      });
      
      setCoinAdjustment(0);
      
      toast({
        title: 'Coins Adjusted',
        description: `${Math.abs(coinAdjustment)} coins ${coinAdjustment > 0 ? 'added to' : 'deducted from'} ${selectedUser.username}'s account`,
      });
    } catch (error) {
      console.error('Error adjusting user coins:', error);
      toast({
        title: 'Error',
        description: 'Failed to adjust coins',
        variant: 'destructive',
      });
    } finally {
      setAdjustingCoins(false);
    }
  };

  const userColumns = [
    {
      header: "User",
      accessorKey: (row: User): ReactNode => (
        <div>
          <div className="font-medium">{row.username}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Role",
      accessorKey: (row: User): ReactNode => (
        <Badge className={row.role === 'admin' ? 'bg-blue-500' : 'bg-gray-500'}>
          {row.role}
        </Badge>
      ),
    },
    {
      header: "Coins",
      accessorKey: (row: User): ReactNode => row.coins,
    },
    {
      header: "Joined",
      accessorKey: (row: User): ReactNode => (
        <div className="text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: User): ReactNode => (
        <Button size="sm" onClick={(e) => {
          e.stopPropagation();
          handleUserClick(row);
        }}>
          Manage
        </Button>
      ),
    },
  ];

  const withdrawalColumns = [
    {
      header: "Amount",
      accessorKey: (row: UserWithdrawal): ReactNode => (
        <div className="font-medium">₹{row.amount}</div>
      ),
    },
    {
      header: "Coins Spent",
      accessorKey: (row: UserWithdrawal): ReactNode => row.coins_spent,
    },
    {
      header: "Method",
      accessorKey: (row: UserWithdrawal): ReactNode => row.method,
    },
    {
      header: "Status",
      accessorKey: (row: UserWithdrawal): ReactNode => row.status,
    },
    {
      header: "Date",
      accessorKey: (row: UserWithdrawal): ReactNode => (
        <div className="text-sm">
          {new Date(row.requested_at).toLocaleDateString()}
        </div>
      ),
    },
  ];
  
  const purchaseColumns = [
    {
      header: "App",
      accessorKey: (row: UserPurchase): ReactNode => row.app_name,
    },
    {
      header: "Payment Type",
      accessorKey: (row: UserPurchase): ReactNode => row.payment_type,
    },
    {
      header: "Date",
      accessorKey: (row: UserPurchase): ReactNode => (
        <div className="text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      ),
    },
  ];

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">View and manage user accounts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              <span>All Users</span>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={userColumns}
            data={filteredUsers}
            onRowClick={handleUserClick}
            isLoading={loading}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Manage user: {selectedUser.username}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-3 gap-4 my-4">
                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="text-sm truncate">{selectedUser.id}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm truncate">{selectedUser.email}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-md flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coins</p>
                    <p className="text-xl font-bold">{selectedUser.coins}</p>
                  </div>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      Adjust
                    </Button>
                  </DialogTrigger>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Coin Adjustment</p>
                  <div className="flex items-center mt-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setCoinAdjustment(prev => prev - 10)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      className="w-24 mx-2 text-center"
                      type="number"
                      value={coinAdjustment}
                      onChange={(e) => setCoinAdjustment(Number(e.target.value))}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setCoinAdjustment(prev => prev + 10)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={adjustUserCoins}
                  disabled={coinAdjustment === 0 || adjustingCoins}
                  variant={coinAdjustment > 0 ? "default" : "destructive"}
                >
                  {adjustingCoins ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    coinAdjustment > 0 ? `Add ${coinAdjustment} Coins` : `Remove ${Math.abs(coinAdjustment)} Coins`
                  )}
                </Button>
              </div>
              
              <Tabs defaultValue="withdrawals">
                <TabsList className="w-full">
                  <TabsTrigger value="withdrawals" className="flex-1">Withdrawals</TabsTrigger>
                  <TabsTrigger value="purchases" className="flex-1">Purchases</TabsTrigger>
                </TabsList>
                <TabsContent value="withdrawals" className="mt-4">
                  <DataTable
                    columns={withdrawalColumns}
                    data={userWithdrawals}
                    isLoading={loadingDetails}
                    emptyMessage="No withdrawal history"
                  />
                </TabsContent>
                <TabsContent value="purchases" className="mt-4">
                  <DataTable
                    columns={purchaseColumns}
                    data={userPurchases}
                    isLoading={loadingDetails}
                    emptyMessage="No purchase history"
                  />
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
