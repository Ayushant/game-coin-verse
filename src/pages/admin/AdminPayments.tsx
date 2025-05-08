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
import { Loader2, Check, X } from 'lucide-react';

interface ManualPayment {
  id: string;
  app_id: string;
  app_name: string;
  user_id: string;
  user_name: string;
  payment_method: string;
  payment_proof_url: string | null;
  user_note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  verified_at: string | null;
}

const AdminPayments = () => {
  const { isAdmin } = useAdmin();
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      loadPayments();
    }
  }, [isAdmin]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      // Fetch manual payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('manual_payments')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      if (paymentsError) throw paymentsError;
      
      // Process the payments data
      const formattedPayments: ManualPayment[] = [];
      
      for (const payment of paymentsData || []) {
        // Get app details
        const { data: appData, error: appError } = await supabase
          .from('paid_apps')
          .select('name')
          .eq('id', payment.app_id)
          .single();
        
        if (appError) console.error('Error fetching app details:', appError);
        
        // Get user details - make sure we only select fields that exist in the profile table
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', payment.user_id)
          .single();
        
        if (userError) console.error('Error fetching user details:', userError);
        
        formattedPayments.push({
          ...payment,
          app_name: appData?.name || 'Unknown App',
          user_name: userData?.username || 'Unknown User',
          status: payment.status as 'pending' | 'approved' | 'rejected',
        });
      }
      
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

  const handleViewPayment = (payment: ManualPayment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handlePaymentAction = async (status: 'approved' | 'rejected') => {
    if (!selectedPayment) return;
    
    try {
      setProcessing(true);
      
      // Update payment status
      const { error: updateError } = await supabase
        .from('manual_payments')
        .update({
          status: status,
          verified_at: new Date().toISOString()
        })
        .eq('id', selectedPayment.id);
      
      if (updateError) throw updateError;
      
      // If approved, create a purchase record
      if (status === 'approved') {
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: selectedPayment.user_id,
            app_id: selectedPayment.app_id,
            payment_type: 'manual',
          });
        
        if (purchaseError) throw purchaseError;
      }
      
      toast({
        title: 'Payment Processed',
        description: `The payment has been ${status}`,
      });
      
      // Update local state
      setPayments(payments.map(payment => 
        payment.id === selectedPayment.id
          ? { 
              ...payment, 
              status, 
              verified_at: new Date().toISOString() 
            }
          : payment
      ));
      
      // Close dialog
      setDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
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
  
  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manual Payments</h1>
        <p className="text-muted-foreground">Manage manual payment requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payment Requests</CardTitle>
          <CardDescription>
            Approve or reject manual payment requests from users
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manual Payment Details</DialogTitle>
              <DialogDescription>
                Review and process this payment request
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-base">{selectedPayment.user_name}</p>
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
                {selectedPayment.verified_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Verified At</p>
                    <p className="text-base">{new Date(selectedPayment.verified_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {selectedPayment.user_note && (
                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="text-sm font-medium text-muted-foreground mb-2">User Note</p>
                  <p className="text-base break-words">{selectedPayment.user_note}</p>
                </div>
              )}
              
              {selectedPayment.payment_proof_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Payment Proof</p>
                  <div className="border rounded-md overflow-hidden">
                    <img 
                      src={selectedPayment.payment_proof_url} 
                      alt="Payment Proof" 
                      className="w-full h-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              {selectedPayment.status === 'pending' ? (
                <>
                  <Button
                    variant="destructive"
                    disabled={processing}
                    onClick={() => handlePaymentAction('rejected')}
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
                    onClick={() => handlePaymentAction('approved')}
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

export default AdminPayments;
