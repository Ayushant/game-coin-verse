
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';

const AdminSettings = () => {
  const { isAdmin, conversionRate, updateConversionRate } = useAdmin();
  const [coinsToInrRate, setCoinsToInrRate] = useState<string>(conversionRate.toString());
  const { toast } = useToast();

  useEffect(() => {
    setCoinsToInrRate(conversionRate.toString());
  }, [conversionRate]);

  const handleSaveConversionRate = async () => {
    const rate = parseInt(coinsToInrRate, 10);
    
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: 'Invalid Rate',
        description: 'Please enter a valid positive number',
        variant: 'destructive',
      });
      return;
    }
    
    await updateConversionRate(rate);
  };
  
  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Configure platform settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coin Conversion Rate</CardTitle>
          <CardDescription>
            Set the conversion rate between coins and INR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conversionRate">
                Coins per 1 INR (₹)
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="conversionRate"
                  type="number"
                  min="1"
                  value={coinsToInrRate}
                  onChange={(e) => setCoinsToInrRate(e.target.value)}
                  className="max-w-xs"
                />
                <span className="text-sm text-muted-foreground">
                  {coinsToInrRate ? `1 INR (₹) = ${coinsToInrRate} coins` : ''}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">100 coins</span>
                  <span className="text-lg font-medium">
                    ₹{Number((100 / Number(coinsToInrRate || 1)).toFixed(2))}
                  </span>
                </div>
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">500 coins</span>
                  <span className="text-lg font-medium">
                    ₹{Number((500 / Number(coinsToInrRate || 1)).toFixed(2))}
                  </span>
                </div>
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">1000 coins</span>
                  <span className="text-lg font-medium">
                    ₹{Number((1000 / Number(coinsToInrRate || 1)).toFixed(2))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveConversionRate}>Save Conversion Rate</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Configure payment gateways and methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
              <Input
                id="razorpayKeyId"
                type="text"
                placeholder="Enter Razorpay Key ID"
                className="max-w-md"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
              <Input
                id="razorpayKeySecret"
                type="password"
                placeholder="Enter Razorpay Key Secret"
                className="max-w-md"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Save Payment Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminSettings;
