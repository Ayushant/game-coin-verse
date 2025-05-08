
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CoinDisplayProps {
  showBalance?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  coins?: number; // Added optional coins prop
}

const CoinDisplay = ({ 
  showBalance = true, 
  showTooltip = true,
  size = 'md',
  coins
}: CoinDisplayProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!user) return null;

  // Use passed coins prop if provided, otherwise use user.coins
  const coinAmount = typeof coins !== 'undefined' ? coins : user.coins;

  const handleCoinDisplay = () => {
    if (showTooltip) {
      toast({
        title: "Coin Balance",
        description: `Your current balance is ${coinAmount} coins.`,
      });
    }
  };

  const handleNavigate = () => {
    navigate('/wallet');
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div 
      className="coin-display flex items-center bg-gradient-to-r from-purple-500/30 to-purple-600/30 backdrop-blur-sm px-3 py-1.5 rounded-full cursor-pointer hover:from-purple-500/40 hover:to-purple-600/40 transition-colors" 
      onClick={handleNavigate}
      onMouseEnter={handleCoinDisplay}
    >
      <svg
        className={`${sizeClasses[size]} text-game-gold animate-bounce-subtle mr-1.5`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="12" cy="12" r="10" fill="#FFA726" />
        <circle cx="12" cy="12" r="8" fill="#FFD54F" />
        <circle cx="12" cy="12" r="4" fill="#FFE082" />
      </svg>
      {showBalance && <span className={`font-medium ${textSizeClasses[size]} text-white`}>{coinAmount}</span>}
    </div>
  );
};

export default CoinDisplay;
