
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Loader2, Search, Download, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { App, PaymentMethod } from '@/types/app';

const AppStorePage = () => {
  const { user } = useAuth();
  const { getConversionRateInINR } = useAdmin();
  const [apps, setApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadApps();
  }, [user]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = apps.filter(app => 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApps(filtered);
    } else {
      setFilteredApps(apps);
    }
  }, [searchTerm, apps]);

  const loadApps = async () => {
    try {
      setLoading(true);
      
      const { data: appsData, error: appsError } = await supabase
        .from('paid_apps')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (appsError) throw appsError;
      
      // If user is logged in, check purchased apps
      if (user && user.id && !user.isGuest) {
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('purchases')
          .select('app_id')
          .eq('user_id', user.id);
          
        if (purchasesError) throw purchasesError;
        
        const purchasedAppIds = purchasesData.map(purchase => purchase.app_id);
        
        const appsWithPurchaseStatus = appsData.map(app => ({
          ...app,
          payment_method: app.payment_method as PaymentMethod,
          is_purchased: purchasedAppIds.includes(app.id)
        }));
        
        setApps(appsWithPurchaseStatus as App[]);
        setFilteredApps(appsWithPurchaseStatus as App[]);
      } else {
        setApps(appsData.map(app => ({
          ...app,
          payment_method: app.payment_method as PaymentMethod
        })) as App[]);
        setFilteredApps(appsData.map(app => ({
          ...app,
          payment_method: app.payment_method as PaymentMethod
        })) as App[]);
      }
    } catch (error) {
      console.error('Error loading apps:', error);
      toast({
        title: 'Error',
        description: 'Failed to load apps',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (app: App) => {
    if (!app.download_url) return;
    
    // Open the link in a new tab/window
    window.open(app.download_url, '_blank', 'noopener,noreferrer');
    
    toast({
      title: 'Download Started',
      description: 'Your download has started in a new tab',
    });
  };

  const renderPrice = (app: App) => {
    if (app.is_purchased) {
      return <span className="text-green-500 font-medium">Purchased</span>;
    }
    
    if (app.payment_method === 'free') {
      return <span className="text-gray-500">Free</span>;
    }
    
    return (
      <div className="space-y-1">
        {app.coin_price && (
          <div className="font-medium">{app.coin_price} coins</div>
        )}
        {app.inr_price && (
          <div className="text-sm">₹{app.inr_price}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">App Store</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="Search apps..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApps.map((app) => (
            <Card key={app.id} className="overflow-hidden h-full">
              <div className="relative h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
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
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{app.name}</h3>
                  {renderPrice(app)}
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {app.description}
                </p>
              </CardContent>
              <CardFooter>
                {app.is_purchased ? (
                  <a 
                    href={app.download_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full no-underline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDownload(app);
                    }}
                  >
                    <Button 
                      variant="secondary"
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </a>
                ) : (
                  <Link 
                    to={`/store/app/${app.id}`} 
                    className="w-full"
                  >
                    <Button 
                      variant="default"
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            {searchTerm ? 'No apps match your search' : 'No apps available'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AppStorePage;
