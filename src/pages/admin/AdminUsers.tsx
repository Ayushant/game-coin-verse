
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { Search } from 'lucide-react';

type UserProfile = {
  id: string;
  username: string;
  email: string;
  coins: number;
  role: 'user' | 'admin' | null;
  created_at: string;
  avatar_url: string | null;
};

type UserWithdrawal = {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
};

type UserPurchase = {
  id: string;
  app_name: string;
  payment_type: string;
  purchased_at: string;
};

const AdminUsers = () => {
  const { isAdmin } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userWithdrawals, setUserWithdrawals] = useState<UserWithdrawal[]>([]);
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([]);
  const [userWithdrawalsLoading, setUserWithdrawalsLoading] = useState(false);
  const [userPurchasesLoading, setUserPurchasesLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // Get emails from auth.users using service role (would need admin rights)
      const formattedUsers = profiles.map(profile => ({
        ...profile,
        email: profile.email || 'Anonymous',
      }));
      
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
      setUserWithdrawalsLoading(true);
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });
        
      if (error) throw error;
      
      setUserWithdrawals(data || []);
    } catch (error) {
      console.error('Error loading user withdrawals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load withdrawal history',
        variant: 'destructive',
      });
    } finally {
      setUserWithdrawalsLoading(false);
    }
  };

  const loadUserPurchases = async (userId: string) => {
    try {
      setUserPurchasesLoading(true);
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          paid_apps:app_id (name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedPurchases = data.map(item => ({
        id: item.id,
        app_name: item.paid_apps?.name || 'Unknown App',
        payment_type: item.payment_type,
        purchased_at: item.created_at,
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
      setUserPurchasesLoading(false);
    }
  };

  const handleViewUser = async (user: UserProfile) => {
    setSelectedUser(user);
    setDialogOpen(true);
    
    // Load user details
    await Promise.all([
      loadUserWithdrawals(user.id),
      loadUserPurchases(user.id)
    ]);
  };

  const updateUserCoins = async (amount: number) => {
    if (!selectedUser) return;
    
    try {
      const newCoins = selectedUser.coins + amount;
      
      if (newCoins < 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Cannot reduce coins below zero',
          variant: 'destructive',
        });
        return;
      }
      
      // Update user coins
      const { error } = await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('id', selectedUser.id);
        
      if (error) throw error;

      // Update local state
      const updatedUser = { ...selectedUser, coins: newCoins };
      setSelectedUser(updatedUser);
      
      // Update users list
      setUsers(users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      ));

      toast({
        title: 'Coins Updated',
        description: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} coins`,
      });
    } catch (error) {
      console.error('Error updating coins:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user coins',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      header: "User",
      accessorKey: (row: UserProfile) => (
        <div>
          <div className="font-medium">{row.username}</div>
          <div className="text-sm text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Coins",
      accessorKey: (row: UserProfile) => (
        <div className="font-medium">{row.coins || 0}</div>
      ),
    },
    {
      header: "Role",
      accessorKey: (row: UserProfile) => (
        <div className="capitalize">{row.role || 'user'}</div>
      ),
    },
    {
      header: "Joined",
      accessorKey: (row: UserProfile) => (
        <div className="text-sm">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: UserProfile) => (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleViewUser(row);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const withdrawalsColumns = [
    {
      header: "Amount",
      accessorKey: (row: UserWithdrawal) => (
        <div className="font-medium">₹{row.amount}</div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      className: "capitalize",
    },
    {
      header: "Requested",
      accessorKey: (row: UserWithdrawal) => (
        new Date(row.requested_at).toLocaleDateString()
      ),
    },
  ];

  const purchasesColumns = [
    {
      header: "App",
      accessorKey: "app_name",
    },
    {
      header: "Payment Type",
      accessorKey: "payment_type",
      className: "capitalize",
    },
    {
      header: "Date",
      accessorKey: (row: UserPurchase) => (
        new Date(row.purchased_at).toLocaleDateString()
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
        <p className="text-muted-foreground">View and manage all users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search users by name or email"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DataTable
            columns={columns}
            data={filteredUsers}
            onRowClick={handleViewUser}
            isLoading={loading}
            emptyMessage={searchTerm ? "No users match your search" : "No users found"}
          />
        </CardContent>
      </Card>

      {selectedUser && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                View and manage user information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-base">{selectedUser.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <p className="text-base capitalize">{selectedUser.role || 'user'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Coins</p>
                  <p className="text-base">{selectedUser.coins || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Joined</p>
                  <p className="text-base">
                    {selectedUser.created_at 
                      ? new Date(selectedUser.created_at).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Manage Coins</p>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateUserCoins(-100)}
                  >
                    -100
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateUserCoins(-10)}
                  >
                    -10
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => updateUserCoins(10)}
                  >
                    +10
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => updateUserCoins(100)}
                  >
                    +100
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => updateUserCoins(1000)}
                  >
                    +1000
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="withdrawals">
                <TabsList className="mb-4">
                  <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                  <TabsTrigger value="purchases">App Purchases</TabsTrigger>
                </TabsList>
                <TabsContent value="withdrawals">
                  <DataTable
                    columns={withdrawalsColumns}
                    data={userWithdrawals}
                    isLoading={userWithdrawalsLoading}
                    emptyMessage="No withdrawal history"
                    className="max-h-64 overflow-auto"
                  />
                </TabsContent>
                <TabsContent value="purchases">
                  <DataTable
                    columns={purchasesColumns}
                    data={userPurchases}
                    isLoading={userPurchasesLoading}
                    emptyMessage="No purchase history"
                    className="max-h-64 overflow-auto"
                  />
                </TabsContent>
              </Tabs>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminUsers;
