
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft, ExternalLink } from 'lucide-react';
import { App, PaymentMethod } from '@/types/app';

const AppDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUserCoins } = useAuth();
  const { getConversionRateInINR } = useAdmin();
  const { toast } = useToast();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);

  useEffect(() => {
    if (id) {
      loadAppDetails(id);
    }
  }, [id, user]);

  const loadAppDetails = async (appId: string) => {
    try {
      setLoading(true);
      
      // Get app details
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
          .eq('app_id', appId)
          .eq('user_id', user.id)
          .single();
          
        if (!purchaseError && purchaseData) {
          setIsPurchased(true);
        }
        
        setApp({
          ...appData,
          payment_method: appData.payment_method as PaymentMethod,
          is_purchased: !purchaseError && purchaseData ? true : false
        });
      } else {
        setApp({
          ...appData,
          payment_method: appData.payment_method as PaymentMethod
        });
      }
    } catch (error) {
      console.error('Error loading app details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load app details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCoinPurchase = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to purchase this app',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    
    if (!app || !app.coin_price) return;
    
    try {
      setPurchasing(true);
      
      // Check if user has enough coins
      if (user.coins < app.coin_price) {
        toast({
          title: 'Insufficient Coins',
          description: `You need ${app.coin_price - user.coins} more coins to purchase this app`,
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
          payment_type: 'coins'
        });
      
      if (purchaseError) throw purchaseError;
      
      // Deduct coins from user's account (handled by trigger)
      const { error: rewardError } = await supabase
        .from('rewards')
        .insert({
          user_id: user.id,
          coins: -app.coin_price,
          action: 'app_purchase'
        });
      
      if (rewardError) throw rewardError;
      
      // Update local state
      setIsPurchased(true);
      setApp({ ...app, is_purchased: true });
      
      // Update user's coins in context
      if (updateUserCoins) {
        await updateUserCoins(-app.coin_price);
      }
      
      toast({
        title: 'Purchase Successful',
        description: `You have purchased ${app.name}`,
      });
    } catch (error) {
      console.error('Error purchasing app:', error);
      toast({
        title: 'Purchase Failed',
        description: 'There was an error processing your purchase',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleManualPayment = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to purchase this app',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    
    if (!app) return;
    
    // Navigate to manual payment page with app ID
    navigate(`/store/payment/${app.id}`);
  };

  const handleDownload = () => {
    if (!app || !app.download_url) return;
    
    // Open the link in a new tab/window
    window.open(app.download_url, '_blank', 'noopener,noreferrer');
    
    toast({
      title: 'Download Started',
      description: 'Your download has started in a new tab',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading app details...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">App Not Found</h1>
        <p className="mb-4 text-muted-foreground">
          The app you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/store">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Store
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Link to="/store" className="inline-flex items-center text-sm text-muted-foreground mb-6">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Store
      </Link>
      
      <div className="bg-card rounded-lg overflow-hidden border">
        <div className="h-48 bg-muted relative">
          {app.image_url ? (
            <img 
              src={app.image_url} 
              alt={app.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted-foreground/10">
              <p className="text-muted-foreground">No image available</p>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{app.name}</h1>
          
          <div className="mb-6">
            {app.is_purchased ? (
              <div className="flex items-center space-x-2 text-green-500 mb-2">
                <span className="font-semibold">Purchased</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-2">
                {app.coin_price && (
                  <div className="bg-primary/10 rounded-full px-3 py-1">
                    <span className="font-semibold">{app.coin_price} coins</span>
                  </div>
                )}
                {app.inr_price && (
                  <div className="bg-primary/10 rounded-full px-3 py-1">
                    <span className="font-semibold">₹{app.inr_price}</span>
                  </div>
                )}
                {app.payment_method === 'free' && (
                  <div className="bg-green-500/10 rounded-full px-3 py-1">
                    <span className="font-semibold text-green-500">Free</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {app.description}
            </p>
          </div>
          
          {app.payment_method === 'manual' && app.payment_instructions && !app.is_purchased && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Payment Instructions</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {app.payment_instructions}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-4">
            {app.is_purchased ? (
              <a 
                href={app.download_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="no-underline"
              >
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download App
                </Button>
              </a>
            ) : (
              <>
                {app.payment_method === 'coins' && app.coin_price && (
                  <Button 
                    size="lg"
                    className="w-full"
                    onClick={handleCoinPurchase}
                    disabled={purchasing || !user}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Buy with {app.coin_price} coins</>
                    )}
                  </Button>
                )}
                
                {app.payment_method === 'manual' && app.inr_price && (
                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={handleManualPayment}
                    disabled={!user}
                  >
                    Pay ₹{app.inr_price} manually
                  </Button>
                )}
                
                {app.payment_method === 'razorpay' && app.inr_price && (
                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={!user}
                  >
                    Pay ₹{app.inr_price} with Razorpay
                  </Button>
                )}
                
                {app.payment_method === 'free' && (
                  <a 
                    href={app.download_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="no-underline"
                  >
                    <Button 
                      size="lg"
                      className="w-full"
                      disabled={!user}
                    >
                      <ExternalLink className="mr-2 h-5 w-5" />
                      Download Free App
                    </Button>
                  </a>
                )}
                
                {!user && (
                  <p className="text-center text-muted-foreground text-sm">
                    <Link to="/login" className="text-primary hover:underline">Login</Link> or <Link to="/register" className="text-primary hover:underline">Register</Link> to download this app
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDetailPage;
