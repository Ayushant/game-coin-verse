
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Check, Star, Zap } from 'lucide-react';

interface SubscriptionPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubscriptionPrompt: React.FC<SubscriptionPromptProps> = ({ open, onOpenChange }) => {
  const { purchaseSubscription, loading } = useSubscription();

  const handlePurchase = async (plan: 'basic' | 'premium') => {
    const success = await purchaseSubscription(plan);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            🎉 Congratulations! Time to Upgrade
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            You've earned ₹40+ or made a withdrawal! To continue earning, please choose a subscription plan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Basic Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Basic Plan
                </CardTitle>
                <Badge variant="outline">Popular</Badge>
              </div>
              <CardDescription>Perfect for casual players</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">₹19<span className="text-sm font-normal">/month</span></div>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Continue earning coins
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Unlimited game plays
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Withdraw earnings
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Access to all games
                </li>
              </ul>
              
              <Button 
                className="w-full" 
                onClick={() => handlePurchase('basic')}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Choose Basic'}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-amber-500">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-amber-500 text-white">
                <Star className="h-3 w-3 mr-1" />
                Best Value
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Premium Plan
              </CardTitle>
              <CardDescription>Maximum earning potential</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">₹49<span className="text-sm font-normal">/month</span></div>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Everything in Basic
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-amber-500" />
                  <strong>2x coin multiplier</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-amber-500" />
                  <strong>Priority withdrawals</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-amber-500" />
                  <strong>Exclusive premium games</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-amber-500" />
                  <strong>Lower withdrawal minimums</strong>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600" 
                onClick={() => handlePurchase('premium')}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Choose Premium'}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-center text-muted-foreground">
            💡 <strong>Why subscriptions?</strong> This helps us maintain the platform, ensure fair payouts, 
            and continue adding new games and features for everyone to enjoy!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPrompt;
