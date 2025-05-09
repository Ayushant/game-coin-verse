
import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReactNode } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { UserWithdrawal, WithdrawalStatus } from '@/types/app';

interface Withdrawal extends UserWithdrawal {
  user_name: string;
  user_email: string;
}

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      
      console.log("Fetching withdrawals data...");
      
      // Use anon key directly to bypass RLS for admin operations
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('requested_at', { ascending: false });
      
      if (withdrawalsError) {
        console.error('Error fetching withdrawals:', withdrawalsError);
        throw withdrawalsError;
      }
      
      // Check if we have any data
      if (!withdrawalsData || withdrawalsData.length === 0) {
        console.log('No withdrawal requests found');
        setWithdrawals([]);
        setLoading(false);
        return;
      }
      
      console.log('Fetched withdrawals:', withdrawalsData.length);
      
      // Process the withdrawal data
      const formattedWithdrawals: Withdrawal[] = [];
      
      for (const withdrawal of withdrawalsData) {
        try {
          // Get user details
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', withdrawal.user_id)
            .single();
          
          if (userError) {
            console.error('Error fetching user details for withdrawal ID:', withdrawal.id, userError);
          }
            
          formattedWithdrawals.push({
            ...withdrawal,
            status: withdrawal.status as WithdrawalStatus,
            user_name: userData?.username || 'Unknown User',
            user_email: userData?.username ? `${userData.username}@example.com` : 'Unknown',
          });
        } catch (userFetchError) {
          console.error('Error processing withdrawal:', userFetchError);
          // Still add the withdrawal with placeholder user info
          formattedWithdrawals.push({
            ...withdrawal,
            status: withdrawal.status as WithdrawalStatus,
            user_name: 'Unknown User',
            user_email: 'Unknown',
          });
        }
      }
      
      setWithdrawals(formattedWithdrawals);
      console.log('Processed withdrawals:', formattedWithdrawals.length);
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

  const processWithdrawal = async (status: WithdrawalStatus) => {
    if (!selectedWithdrawal) return;
    
    try {
      setProcessing(true);
      
      console.log(`Processing withdrawal ${selectedWithdrawal.id} with status: ${status}`);
      
      // Call the edge function to process the withdrawal
      const supabaseUrl = "https://ozdofjghekhuqrwidwsv.supabase.co";
      const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96ZG9mamdoZWtodXFyd2lkd3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTI5NDEsImV4cCI6MjA2MjEyODk0MX0.1DTbw9K_I6Qz4tKl09U2qJTaSBQ0oc1hP3YvLBIrZ-E";
      
      const response = await fetch(`${supabaseUrl}/functions/v1/process-withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal.id,
          status: status,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from process-withdrawal function:', errorText);
        let errorMessage;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || 'Failed to process withdrawal';
        } catch (parseError) {
          errorMessage = 'Failed to process withdrawal: Invalid response from server';
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Edge function response:', result);
      
      toast({
        title: 'Withdrawal Processed',
        description: `Withdrawal request ${status === 'completed' ? 'approved' : 'rejected'}`,
      });
      
      // Update local state
      setWithdrawals(withdrawals.map(withdrawal => 
        withdrawal.id === selectedWithdrawal.id
          ? { 
              ...withdrawal, 
              status, 
              processed_at: new Date().toISOString() 
            }
          : withdrawal
      ));
      
      // Close dialog
      setDialogOpen(false);
      setSelectedWithdrawal(null);
      
      // Reload withdrawals to ensure data is fresh
      loadWithdrawals();
      
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process withdrawal request',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: WithdrawalStatus): ReactNode => {
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
      accessorKey: (row: Withdrawal): ReactNode => (
        <div>
          <div className="font-medium">{row.user_name}</div>
          <div className="text-sm text-muted-foreground">{row.user_email}</div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: (row: Withdrawal): ReactNode => (
        <div className="font-medium">₹{row.amount}</div>
      ),
    },
    {
      header: "Coins Spent",
      accessorKey: (row: Withdrawal): ReactNode => row.coins_spent,
    },
    {
      header: "Method",
      accessorKey: (row: Withdrawal): ReactNode => row.method,
    },
    {
      header: "Status",
      accessorKey: (row: Withdrawal): ReactNode => getStatusBadge(row.status),
    },
    {
      header: "Requested On",
      accessorKey: (row: Withdrawal): ReactNode => (
        <div className="text-sm">
          {new Date(row.requested_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: Withdrawal): ReactNode => (
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
        <p className="text-muted-foreground">Manage user withdrawal requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Withdrawal Requests</CardTitle>
          <CardDescription>
            Process user requests to withdraw coins as money
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Withdrawal Request Details</DialogTitle>
              <DialogDescription>
                Review and process this withdrawal request
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
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
                  <p className="text-lg font-bold">₹{selectedWithdrawal.amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Coins Spent</p>
                  <p className="text-lg font-bold">{selectedWithdrawal.coins_spent}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Method</p>
                  <p className="text-base capitalize">{selectedWithdrawal.method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedWithdrawal.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested At</p>
                  <p className="text-base">{new Date(selectedWithdrawal.requested_at).toLocaleString()}</p>
                </div>
                {selectedWithdrawal.processed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Processed At</p>
                    <p className="text-base">{new Date(selectedWithdrawal.processed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm font-medium text-muted-foreground mb-2">Payment Details</p>
                <p className="text-base break-words">{selectedWithdrawal.payment_detail}</p>
              </div>
            </div>
            
            <DialogFooter>
              {selectedWithdrawal.status === 'pending' ? (
                <>
                  <Button
                    variant="destructive"
                    disabled={processing}
                    onClick={() => processWithdrawal('failed')}
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                  <Button
                    disabled={processing}
                    onClick={() => processWithdrawal('completed')}
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminWithdrawals;
