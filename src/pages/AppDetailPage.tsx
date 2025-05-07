
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

type App = {
  id: string;
  name: string;
  description: string;
  download_url: string;
  image_url: string | null;
  coin_price: number | null;
  inr_price: number | null;
  payment_method: 'coins' | 'razorpay' | 'manual' | 'free';
  payment_instructions: string | null;
  created_at: string;
  is_purchased?: boolean;
};

const AppDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUserCoins } = useAuth();
  const { getConversionRateInINR } = useAdmin();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'coins' | 'manual' | 'razorpay' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadApp(id);
    }
  }, [id, user]);

  const loadApp = async (appId: string) => {
    try {
      setLoading(true);
      
      const { data: appData, error: appError } = await supabase
        .from('paid_apps')
        .select('*')
        .eq('id', appId)
        .single();
        
      if (appError) throw appError;
      
      // Check if user has purchased this app
      if (user) {
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)
          .eq('app_id', appId)
          .maybeSingle();
          
        if (purchaseError && purchaseError.code !== 'PGRST116') {
          throw purchaseError;
        }
        
        setApp({
          ...appData,
          is_purchased: !!purchaseData
        });
      } else {
        setApp(appData);
      }
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

  const handlePurchaseWithCoins = async () => {
    if (!app || !user) return;
    
    try {
      setPurchasing(true);
      
      if (!app.coin_price) {
        toast({
          title: 'Error',
          description: 'This app has no coin price',
          variant: 'destructive',
        });
        return;
      }
      
      // Check user's coin balance
      if ((user.coins || 0) < app.coin_price) {
        toast({
          title: 'Insufficient Coins',
          description: 'You don\'t have enough coins to purchase this app',
          variant: 'destructive',
        });
        return;
      }
      
      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          app_id: app.id,
          payment_type: 'coins',
        });
        
      if (purchaseError) throw purchaseError;
      
      // Deduct coins from user's balance
      await updateUserCoins(-app.coin_price);
      
      toast({
        title: 'Purchase Successful',
        description: 'App has been added to your library',
      });
      
      // Update app state to reflect purchase
      setApp({ ...app, is_purchased: true });
    } catch (error) {
      console.error('Error purchasing app:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Failed to complete the purchase',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handlePaymentOptionSelect = (method: 'coins' | 'manual' | 'razorpay') => {
    setPaymentMethod(method);
    
    if (method === 'coins') {
      handlePurchaseWithCoins();
    } else if (method === 'manual') {
      navigate(`/store/payment/${app?.id}`);
    } else if (method === 'razorpay') {
      // To be implemented with Razorpay integration
      toast({
        title: 'Razorpay Coming Soon',
        description: 'This payment option will be available soon',
      });
    }
    
    setDialogOpen(false);
  };

  const renderPurchaseOptions = () => {
    if (!app || !user) return null;
    
    if (app.is_purchased) {
      return (
        <Button 
          className="w-full flex gap-2"
          size="lg"
          onClick={() => window.open(app.download_url, '_blank')}
        >
          <Download size={18} />
          Download App
        </Button>
      );
    }
    
    if (app.payment_method === 'free') {
      return (
        <Button 
          className="w-full"
          size="lg"
          onClick={() => window.open(app.download_url, '_blank')}
        >
          Download Free
        </Button>
      );
    }
    
    if (app.payment_method === 'coins' && app.coin_price) {
      return (
        <Button 
          className="w-full"
          size="lg"
          onClick={handlePurchaseWithCoins}
          disabled={purchasing || (user.coins || 0) < app.coin_price}
        >
          {purchasing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Buy with ${app.coin_price} Coins`
          )}
        </Button>
      );
    }
    
    // For apps with multiple payment options
    return (
      <Button 
        className="w-full"
        size="lg"
        onClick={() => setDialogOpen(true)}
      >
        Purchase App
      </Button>
    );
  };

  const renderPriceInfo = () => {
    if (!app) return null;
    
    if (app.payment_method === 'free') {
      return <Badge className="bg-green-500">Free</Badge>;
    }
    
    return (
      <div className="space-y-2">
        {app.coin_price && (
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500">{app.coin_price} coins</Badge>
          </div>
        )}
        {app.inr_price && (
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500">₹{app.inr_price}</Badge>
          </div>
        )}
      </div>
    );
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
        onClick={() => navigate('/store')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Store
      </Button>
      
      <Card>
        <div className="relative h-48 md:h-64 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {app.image_url ? (
            <img 
              src={app.image_url} 
              alt={app.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No image available
            </div>
          )}
        </div>
        
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{app.name}</CardTitle>
              <CardDescription>
                Added on {new Date(app.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            {renderPriceInfo()}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="whitespace-pre-wrap">{app.description}</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex-col space-y-4">
          {!user ? (
            <p className="text-center text-muted-foreground mb-2">
              Please log in to purchase this app
            </p>
          ) : (
            renderPurchaseOptions()
          )}
        </CardFooter>
      </Card>
      
      {/* Payment Options Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Select how you want to pay for {app.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {app.coin_price && (
              <Button
                className="w-full justify-between"
                onClick={() => handlePaymentOptionSelect('coins')}
                disabled={purchasing || (user?.coins || 0) < app.coin_price}
              >
                <span>Pay with Coins</span>
                <span>{app.coin_price} coins</span>
              </Button>
            )}
            
            {app.inr_price && app.payment_method !== 'coins' && (
              <>
                {app.payment_method === 'razorpay' && (
                  <Button 
                    className="w-full justify-between"
                    onClick={() => handlePaymentOptionSelect('razorpay')}
                  >
                    <span>Pay with Razorpay</span>
                    <span>₹{app.inr_price}</span>
                  </Button>
                )}
                
                {app.payment_method === 'manual' && (
                  <Button 
                    className="w-full justify-between"
                    variant="outline"
                    onClick={() => handlePaymentOptionSelect('manual')}
                  >
                    <span>Manual Payment</span>
                    <span>₹{app.inr_price}</span>
                  </Button>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppDetailPage;
