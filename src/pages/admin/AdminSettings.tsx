
import { useState } from 'react';
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
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const AdminSettings = () => {
  const { isAdmin, conversionRate, updateConversionRate } = useAdmin();
  const [newRate, setNewRate] = useState<number>(conversionRate);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
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

  if (!isAdmin) {
    return <div>Access denied</div>;
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
        <form onSubmit={handleSubmit}>
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
    </div>
  );
};

export default AdminSettings;
