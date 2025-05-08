import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CoinDisplay from '@/components/ui/CoinDisplay'; // Fixed import
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Loader2, ChevronRight, Download } from 'lucide-react';

interface GameSession {
  id: string;
  game_name: string;
  coins_earned: number;
  score: number | null;
  played_at: string;
}

interface Purchase {
  id: string;
  app_id: string;
  app_name: string;
  payment_type: string;
  created_at: string;
}

const WalletPage = () => {
  const { user } = useAuth();
  const { getConversionRateInINR } = useAdmin();
  const [gameHistory, setGameHistory] = useState<GameSession[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get game history
      const { data: gameData, error: gameError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(10);
        
      if (gameError) throw gameError;
      
      // Get purchase history with app names
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          *,
          paid_apps!inner(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (purchasesError) throw purchasesError;
      
      const formattedPurchases: Purchase[] = purchasesData.map(purchase => ({
        id: purchase.id,
        app_id: purchase.app_id,
        app_name: purchase.paid_apps.name,
        payment_type: purchase.payment_type,
        created_at: purchase.created_at
      }));
      
      setGameHistory(gameData || []);
      setPurchaseHistory(formattedPurchases || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Wallet</h1>
        <p className="mb-4">Please log in to view your wallet.</p>
        <Link to="/login">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Wallet</h1>
        {user.coins > 0 && (
          <Link to="/withdraw">
            <Button>Withdraw Coins</Button>
          </Link>
        )}
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <CoinDisplay size="lg" /> {/* Fixed component usage */}
          {getConversionRateInINR && (
            <p className="mt-2 text-sm text-muted-foreground">
              ≈ ₹{getConversionRateInINR(user.coins)}
            </p>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="games">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="games" className="flex-1">Game History</TabsTrigger>
          <TabsTrigger value="purchases" className="flex-1">Purchases</TabsTrigger>
        </TabsList>
        
        <TabsContent value="games">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : gameHistory.length > 0 ? (
            <div className="space-y-3">
              {gameHistory.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{session.game_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.played_at).toLocaleString()}
                      </p>
                      {session.score !== null && (
                        <p className="text-sm">Score: {session.score}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <CoinDisplay coins={session.coins_earned} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No game history found. Play games to earn coins!
            </p>
          )}
        </TabsContent>
        
        <TabsContent value="purchases">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : purchaseHistory.length > 0 ? (
            <div className="space-y-3">
              {purchaseHistory.map((purchase) => (
                <Card key={purchase.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{purchase.app_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {purchase.payment_type}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {new Date(purchase.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Link to={`/store/app/${purchase.app_id}`}>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No purchases found. Visit the <Link to="/store" className="text-primary hover:underline">app store</Link> to buy apps!
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletPage;
