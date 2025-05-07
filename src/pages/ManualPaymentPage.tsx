
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, Copy } from 'lucide-react';

type App = {
  id: string;
  name: string;
  inr_price: number | null;
  payment_instructions: string | null;
};

const PAYMENT_PROOF_BUCKET = 'payment_proofs';

const ManualPaymentPage = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (appId) {
      loadApp(appId);
      checkStorageBucket();
    }
  }, [appId]);

  const checkStorageBucket = async () => {
    try {
      // Check if storage bucket exists, create if not
      const { data, error } = await supabase.storage.getBucket(PAYMENT_PROOF_BUCKET);
      
      if (error && error.message.includes('not found')) {
        await supabase.storage.createBucket(PAYMENT_PROOF_BUCKET, {
          public: true
        });
      }
    } catch (error) {
      console.error('Error checking storage bucket:', error);
    }
  };

  const loadApp = async (id: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('paid_apps')
        .select('id, name, inr_price, payment_instructions')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      setApp(data);
    } catch (error) {
      console.error('Error loading app details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load app details',
        variant: 'destructive',
      });
      navigate('/store');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (url: string) => {
    setPaymentProofUrl(url);
  };

  const handleSubmit = async () => {
    if (!app || !user) return;
    
    try {
      setSubmitting(true);
      
      // Validate inputs
      if (!paymentProofUrl) {
        toast({
          title: 'Missing Payment Proof',
          description: 'Please upload a screenshot of your payment',
          variant: 'destructive',
        });
        return;
      }
      
      // Create payment request
      const { error } = await supabase
        .from('manual_payments')
        .insert({
          user_id: user.id,
          app_id: app.id,
          payment_proof_url: paymentProofUrl,
          user_note: userNote.trim() || null,
          payment_method: 'manual',
          status: 'pending',
        });
        
      if (error) throw error;
      
      toast({
        title: 'Payment Submitted',
        description: 'Your payment is under review. You will be notified once approved.',
      });
      
      // Navigate back to store
      navigate('/store');
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit your payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Payment details copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">App not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/store')}
        >
          Back to Store
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate(`/store/app/${app.id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to App
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Manual Payment</CardTitle>
          <CardDescription>
            Complete your purchase for {app.name}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Amount</h3>
            <p className="text-2xl font-bold">₹{app.inr_price}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Payment Instructions</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => app.payment_instructions && copyToClipboard(app.payment_instructions)}
              >
                <Copy size={16} />
              </Button>
              <p className="whitespace-pre-wrap">{app.payment_instructions || "Please contact admin for payment details."}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Upload Payment Proof</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please upload a screenshot of your payment receipt
            </p>
            <FileUpload 
              onUploadComplete={handleUploadComplete}
              storageBucket={PAYMENT_PROOF_BUCKET}
              storagePath="uploads"
              acceptedFileTypes="image/*"
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Additional Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide any additional details about your payment (UPI ID, transaction ID, etc.)
            </p>
            <Textarea 
              placeholder="Enter payment details like UPI ID, transaction ID, etc."
              rows={3}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || !paymentProofUrl}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit for Approval'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ManualPaymentPage;
