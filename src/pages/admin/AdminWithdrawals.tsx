
import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  coins_spent: number;
  payment_detail: string;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  requested_at: string;
  processed_at: string | null;
  user_email?: string;
  user_name?: string;
};

const AdminWithdrawals = () => {
  const { isAdmin } = useAdmin();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      loadWithdrawals();
    }
  }, [isAdmin]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      
      // Get withdrawals with user information
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles:user_id (username, email)
        `)
        .order('requested_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedWithdrawals = data.map(item => ({
        ...item,
        user_email: item.profiles?.email || 'Unknown',
        user_name: item.profiles?.username || 'Unknown User',
      }));
      
      setWithdrawals(formattedWithdrawals);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load withdrawal requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewWithdrawal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setDialogOpen(true);
  };

  const updateWithdrawalStatus = async (status: 'completed' | 'failed') => {
    if (!selectedWithdrawal) return;
    
    try {
      setProcessingAction(true);
      
      // Update withdrawal status
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: status,
          processed_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);
        
      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Withdrawal request marked as ${status}`,
      });

      // Reload withdrawals
      await loadWithdrawals();
      
      // Close dialog
      setDialogOpen(false);
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update withdrawal status',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns = [
    {
      header: "User",
      accessorKey: (row: Withdrawal) => (
        <div>
          <div className="font-medium">{row.user_name}</div>
          <div className="text-sm text-muted-foreground">{row.user_email}</div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: (row: Withdrawal) => (
        <div>
          <div className="font-medium">₹{row.amount}</div>
          <div className="text-sm text-muted-foreground">{row.coins_spent} coins</div>
        </div>
      ),
    },
    {
      header: "Payment Detail",
      accessorKey: (row: Withdrawal) => (
        <div>
          <div className="font-medium">{row.payment_detail}</div>
          <div className="text-sm text-muted-foreground">{row.method}</div>
        </div>
      ),
    },
    {
      header: "Requested",
      accessorKey: (row: Withdrawal) => (
        <div className="text-sm">
          {new Date(row.requested_at).toLocaleString()}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: (row: Withdrawal) => getStatusBadge(row.status),
    },
    {
      header: "Actions",
      accessorKey: (row: Withdrawal) => (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleViewWithdrawal(row);
          }}
        >
          View
        </Button>
      ),
    },
  ];
  
  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
        <p className="text-muted-foreground">Manage user withdrawal requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Withdrawals</CardTitle>
          <CardDescription>
            View and manage all user withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={withdrawals}
            onRowClick={handleViewWithdrawal}
            isLoading={loading}
            emptyMessage="No withdrawal requests found"
          />
        </CardContent>
      </Card>

      {selectedWithdrawal && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdrawal Request Details</DialogTitle>
              <DialogDescription>
                Review and update the status of this withdrawal request
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-base">{selectedWithdrawal.user_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{selectedWithdrawal.user_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-base">₹{selectedWithdrawal.amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Coins Spent</p>
                  <p className="text-base">{selectedWithdrawal.coins_spent}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-base">{selectedWithdrawal.method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Detail</p>
                  <p className="text-base">{selectedWithdrawal.payment_detail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested At</p>
                  <p className="text-base">{new Date(selectedWithdrawal.requested_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-base">{getStatusBadge(selectedWithdrawal.status)}</p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              {selectedWithdrawal.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    disabled={processingAction}
                    onClick={() => updateWithdrawalStatus('failed')}
                  >
                    Reject
                  </Button>
                  <Button
                    disabled={processingAction}
                    onClick={() => updateWithdrawalStatus('completed')}
                  >
                    Approve
                  </Button>
                </>
              )}
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

export default AdminWithdrawals;
