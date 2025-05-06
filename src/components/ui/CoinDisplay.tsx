
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CoinDisplayProps {
  showBalance?: boolean;
}

const CoinDisplay = ({ showBalance = true }: CoinDisplayProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  const handleCoinDisplay = () => {
    toast({
      title: "Coin Balance",
      description: `Your current balance is ${user.coins} coins.`,
    });
  };

  return (
    <div 
      className="coin-display" 
      onClick={handleCoinDisplay}
    >
      <svg
        className="h-5 w-5 text-game-gold animate-bounce-subtle"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="12" cy="12" r="10" fill="#FFA726" />
        <circle cx="12" cy="12" r="8" fill="#FFD54F" />
        <circle cx="12" cy="12" r="4" fill="#FFE082" />
      </svg>
      {showBalance && <span>{user.coins}</span>}
    </div>
  );
};

export default CoinDisplay;
