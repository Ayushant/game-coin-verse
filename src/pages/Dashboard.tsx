
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Badge } from '@/components/ui/badge';
import SubscriptionPrompt from '@/components/SubscriptionPrompt';
import CoinDisplay from '@/components/ui/CoinDisplay';
import { 
  GamepadIcon, 
  Trophy, 
  Coins, 
  Store,
  Clock,
  Star
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { subscriptionRequired, checkSubscriptionStatus } = useSubscription();
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);

  useEffect(() => {
    if (user && !user.isGuest) {
      checkSubscriptionStatus();
    }
  }, [user, checkSubscriptionStatus]);

  useEffect(() => {
    if (subscriptionRequired) {
      setShowSubscriptionPrompt(true);
    }
  }, [subscriptionRequired]);

  const quickStats = [
    {
      title: "Current Balance",
      value: user?.coins || 0,
      icon: Coins,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
    },
    {
      title: "Games Played",
      value: "0", // This would come from actual game data
      icon: GamepadIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Total Earned",
      value: "₹0", // This would come from transactions data
      icon: Trophy,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    }
  ];

  const quickActions = [
    {
      title: "Play Games",
      description: "Earn coins by playing fun games",
      icon: GamepadIcon,
      href: "/games",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "App Store",
      description: "Browse and download paid apps",
      icon: Store,
      href: "/store",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Withdraw",
      description: "Convert your coins to real money",
      icon: Coins,
      href: "/withdraw",
      color: "bg-green-500 hover:bg-green-600"
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to WinWitty</CardTitle>
            <CardDescription>Please log in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/login">
              <Button className="w-full">Log In</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" className="w-full">Sign Up</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user.username || 'Player'}!
          </h1>
          <p className="text-gray-400">
            {user.isGuest ? (
              <>Guest mode - <Link to="/register" className="text-blue-400 hover:underline">Sign up to save progress</Link></>
            ) : (
              'Ready to play and earn?'
            )}
          </p>
        </div>
        <CoinDisplay />
      </div>

      {/* Subscription Status */}
      {!user.isGuest && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">Subscription Status</p>
                <p className="text-sm text-muted-foreground">
                  {subscriptionRequired ? 'Subscription required to continue earning' : 'Active - Keep earning!'}
                </p>
              </div>
            </div>
            {subscriptionRequired && (
              <Button 
                onClick={() => setShowSubscriptionPrompt(true)}
                className="bg-amber-500 hover:bg-amber-600"
              >
                Upgrade Now
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-3 rounded-full text-white mb-4 ${action.color}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Your latest earnings and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No recent activity. Start playing games to see your earnings here!
          </p>
        </CardContent>
      </Card>

      {/* Subscription Prompt Modal */}
      <SubscriptionPrompt 
        open={showSubscriptionPrompt} 
        onOpenChange={setShowSubscriptionPrompt}
      />
    </div>
  );
};

export default Dashboard;
