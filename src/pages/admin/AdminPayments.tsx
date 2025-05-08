
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
import { useAdmin } from '@/contexts/AdminContext';
import { ReactNode } from 'react';

type Payment = {
  id: string;
  user_id: string;
  app_id: string;
  payment_proof_url: string;
  user_note: string;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  verified_at: string | null;
  verified_by: string | null;
  user_name: string;
  user_email: string;
  app_name: string;
};

const AdminPayments = () => {
  const { isAdmin } = useAdmin();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      loadPayments();
    }
  }, [isAdmin]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('manual_payments')
        .select(`
          *,
          profiles:user_id (username, email),
          paid_apps:app_id (name)
        `)
        .order('submitted_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedPayments = data.map(item => ({
        ...item,
        user_name: item.profiles?.username || 'Unknown User',
        user_email: item.profiles?.email || 'Unknown',
        app_name: item.paid_apps?.name || 'Unknown App',
      }));
      
      setPayments(formattedPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const processPayment = async (status: 'approved' | 'rejected') => {
    if (!selectedPayment) return;
    
    try {
      setProcessingAction(true);
      
      if (status === 'approved') {
        // Call the edge function to process the payment
        const { error: functionError } = await supabase.functions.invoke('process-manual-payment', {
          body: { paymentId: selectedPayment.id }
        });
        
        if (functionError) throw functionError;
      } else {
        // Simply update the payment status without creating a purchase record
        const { error } = await supabase
          .from('manual_payments')
          .update({
            status: 'rejected',
            verified_at: new Date().toISOString(),
            verified_by: isAdmin ? 'admin' : null
          })
          .eq('id', selectedPayment.id);
          
        if (error) throw error;
      }

      toast({
        title: 'Payment Processed',
        description: `Payment request ${status === 'approved' ? 'approved' : 'rejected'}`,
      });
      
      // Update local state
      setPayments(payments.map(payment => 
        payment.id === selectedPayment.id
          ? { ...payment, status, verified_at: new Date().toISOString() }
          : payment
      ));
      
      // Close dialog
      setDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment request',
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
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns = [
    {
      header: "User",
      accessorKey: (row: Payment): ReactNode => (
        <div>
          <div className="font-medium">{row.user_name}</div>
          <div className="text-sm text-muted-foreground">{row.user_email}</div>
        </div>
      ),
    },
    {
      header: "App",
      accessorKey: (row: Payment): ReactNode => row.app_name,
    },
    {
      header: "Method",
      accessorKey: (row: Payment): ReactNode => (
        <span className="capitalize">{row.payment_method}</span>
      ),
    },
    {
      header: "Submitted",
      accessorKey: (row: Payment): ReactNode => (
        <div className="text-sm">
          {new Date(row.submitted_at).toLocaleString()}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: (row: Payment): ReactNode => getStatusBadge(row.status),
    },
    {
      header: "Actions",
      accessorKey: (row: Payment): ReactNode => (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleViewPayment(row);
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
        <h1 className="text-2xl font-bold">Payment Requests</h1>
        <p className="text-muted-foreground">Manage manual payment requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payment Requests</CardTitle>
          <CardDescription>
            Review and process manual payment submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={payments}
            onRowClick={handleViewPayment}
            isLoading={loading}
            emptyMessage="No payment requests found"
          />
        </CardContent>
      </Card>

      {selectedPayment && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Payment Request Details</DialogTitle>
              <DialogDescription>
                Review and process this payment request
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-base">{selectedPayment.user_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{selectedPayment.user_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">App</p>
                  <p className="text-base">{selectedPayment.app_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Method</p>
                  <p className="text-base capitalize">{selectedPayment.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-base">{getStatusBadge(selectedPayment.status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted At</p>
                  <p className="text-base">{new Date(selectedPayment.submitted_at).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedPayment.user_note && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User Note</p>
                  <p className="text-base p-3 bg-gray-50 dark:bg-gray-800 rounded-md mt-1">
                    {selectedPayment.user_note}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Payment Proof</p>
                {selectedPayment.payment_proof_url ? (
                  <img 
                    src={selectedPayment.payment_proof_url} 
                    alt="Payment proof" 
                    className="w-full max-h-80 object-contain rounded-md border"
                  />
                ) : (
                  <p className="text-muted-foreground italic">No proof image provided</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              {selectedPayment.status === 'pending' ? (
                <>
                  <Button
                    variant="destructive"
                    disabled={processingAction}
                    onClick={() => processPayment('rejected')}
                  >
                    Reject
                  </Button>
                  <Button
                    disabled={processingAction}
                    onClick={() => processPayment('approved')}
                  >
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

export default AdminPayments;
