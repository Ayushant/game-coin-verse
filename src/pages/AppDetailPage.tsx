
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { ArrowLeft, Download, Loader2, CreditCard } from 'lucide-react';

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
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadApp(id);
    }
  }, [id, user]);

  const loadApp = async (appId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('paid_apps')
        .select('*')
        .eq('id', appId)
        .single();
      
      if (error) throw error;
      
      // Check if user has purchased this app
      if (user && !user.isGuest) {
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('app_id', appId)
          .maybeSingle();
        
        if (purchaseError) throw purchaseError;
        
        setApp({
          ...data,
          is_purchased: !!purchaseData
        });
      } else {
        setApp(data);
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
    
    if (user.isGuest) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to purchase apps',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    
    // Check if user has enough coins
    if (app.coin_price && user.coins < app.coin_price) {
      toast({
        title: 'Insufficient Coins',
        description: `You need ${app.coin_price - user.coins} more coins to purchase this app`,
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setPurchasing(true);
      
      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          app_id: app.id,
          payment_type: 'coins',
        });
      
      if (purchaseError) throw purchaseError;
      
      // Deduct coins from user
      if (app.coin_price) {
        const { error: coinsError } = await supabase
          .from('profiles')
          .update({ coins: user.coins - app.coin_price })
          .eq('id', user.id);
        
        if (coinsError) throw coinsError;
        
        // Update local user state
        await updateUserCoins(-app.coin_price);
      }
      
      // Update app purchase status
      setApp({
        ...app,
        is_purchased: true
      });
      
      toast({
        title: 'Purchase Successful',
        description: `You've successfully purchased ${app.name}`,
      });
    } catch (error) {
      console.error('Error purchasing app:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Failed to complete the purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleManualPayment = () => {
    if (!app || !user) return;
    
    if (user.isGuest) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to make a payment',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    
    // Navigate to manual payment page
    navigate(`/store/payment/${app.id}`);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/store')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to store
        </Button>
        <p className="text-center text-muted-foreground">App not found</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/store')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to store
      </Button>
      
      <Card>
        <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {app.image_url ? (
            <img 
              src={app.image_url} 
              alt={app.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No image
            </div>
          )}
        </div>
        
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-2xl font-bold">{app.name}</h2>
              <div className="mt-1">
                <Badge className={
                  app.payment_method === 'coins' ? 'bg-green-500' : 
                  app.payment_method === 'razorpay' ? 'bg-blue-500' :
                  app.payment_method === 'manual' ? 'bg-purple-500' : 'bg-gray-500'
                }>
                  {app.payment_method === 'free' ? 'Free' : app.payment_method}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              {app.is_purchased ? (
                <div className="text-green-500 font-medium mb-1">Purchased</div>
              ) : (
                <>
                  {app.coin_price && (
                    <div className="text-xl font-bold">{app.coin_price} coins</div>
                  )}
                  {app.inr_price && (
                    <div className="text-muted-foreground">₹{app.inr_price}</div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {app.description}
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          {app.is_purchased ? (
            <Button className="w-full" size="lg" asChild>
              <a href={app.download_url} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download App
              </a>
            </Button>
          ) : (
            <>
              {app.payment_method === 'free' && (
                <Button className="w-full" size="lg" asChild>
                  <a href={app.download_url} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download Free App
                  </a>
                </Button>
              )}
              
              {app.payment_method === 'coins' && app.coin_price && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePurchaseWithCoins}
                  disabled={purchasing || (user && user.coins < app.coin_price)}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Buy with {app.coin_price} Coins
                      {user && !user.isGuest && (
                        <span className="ml-2 text-xs opacity-80">
                          (Balance: {user.coins} coins)
                        </span>
                      )}
                    </>
                  )}
                </Button>
              )}
              
              {(app.payment_method === 'manual' || app.payment_method === 'razorpay') && (
                <Button
                  variant={app.payment_method === 'razorpay' ? 'default' : 'outline'}
                  className="w-full"
                  size="lg"
                  onClick={app.payment_method === 'manual' ? handleManualPayment : undefined}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {app.payment_method === 'razorpay' 
                    ? `Pay ₹${app.inr_price} with Razorpay` 
                    : `Pay ₹${app.inr_price} manually`}
                </Button>
              )}
              
              {!user && (
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link to="/login">Sign In to Purchase</Link>
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AppDetailPage;
