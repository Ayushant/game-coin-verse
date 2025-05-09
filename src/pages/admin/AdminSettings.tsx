import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminSettings = () => {
  const { conversionRate, updateConversionRate } = useAdmin();
  const [newRate, setNewRate] = useState<number>(conversionRate);
  const [minCoins, setMinCoins] = useState<number>(500); // Default value
  const [updating, setUpdating] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const { toast } = useToast();

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadingSettings(true);
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching settings:', error);
        }

        if (data) {
          setNewRate(data.coins_to_inr);
          // Check if min_withdrawal_coins exists in the data
          if ('min_withdrawal_coins' in data && data.min_withdrawal_coins !== null) {
            setMinCoins(data.min_withdrawal_coins);
          } else {
            // Default to 500 if not set
            setMinCoins(500);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmitRate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newRate || newRate <= 0) {
      toast({
        title: 'Invalid value',
        description: 'Please enter a valid conversion rate',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setUpdating(true);
      await updateConversionRate(newRate);
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitMinCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!minCoins || minCoins <= 0) {
      toast({
        title: 'Invalid value',
        description: 'Please enter a valid minimum coins value',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setUpdating(true);
      
      // Update settings table with minimum coins
      const { data, error } = await supabase
        .from('settings')
        .insert({
          coins_to_inr: conversionRate,
          min_withdrawal_coins: minCoins,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: 'Minimum coins updated',
        description: `New minimum withdrawal: ${minCoins} coins`,
      });
      
    } catch (error) {
      console.error('Error updating minimum coins:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update minimum coins',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Configure system settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coin Conversion Rate</CardTitle>
          <CardDescription>
            Set the conversion rate between coins and Indian Rupees (INR)
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitRate}>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="conversionRate">Coins per ₹1</Label>
                <Input
                  id="conversionRate"
                  type="number"
                  min="1"
                  step="1"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  placeholder="100"
                />
                <p className="text-sm text-muted-foreground">
                  Current rate: {conversionRate} coins = ₹1
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm font-medium mb-2">Example conversions:</p>
                <ul className="text-sm space-y-1">
                  <li>1,000 coins = ₹{(1000 / newRate).toFixed(2)}</li>
                  <li>5,000 coins = ₹{(5000 / newRate).toFixed(2)}</li>
                  <li>10,000 coins = ₹{(10000 / newRate).toFixed(2)}</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={updating || newRate === conversionRate}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Conversion Rate'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Minimum Withdrawal</CardTitle>
          <CardDescription>
            Set the minimum amount of coins required for withdrawal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitMinCoins}>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="minCoins">Minimum Coins</Label>
                <Input
                  id="minCoins"
                  type="number"
                  min="1"
                  step="1"
                  value={minCoins}
                  onChange={(e) => setMinCoins(Number(e.target.value))}
                  placeholder="500"
                />
                <p className="text-sm text-muted-foreground">
                  Users will need at least {minCoins} coins to make a withdrawal
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm font-medium mb-2">In INR:</p>
                <p className="text-sm">
                  {minCoins} coins = ₹{(minCoins / conversionRate).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Minimum Coins'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminSettings;
