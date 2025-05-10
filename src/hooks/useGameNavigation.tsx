
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AdService from '@/services/AdService';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to handle game navigation with interstitial ads
 */
export function useGameNavigation() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToGame = async (route: string) => {
    setIsLoading(true);
    try {
      // Initialize AdMob first if needed
      await AdService.initialize();
      
      // Show interstitial ad before navigating
      await AdService.showGameEntryAd();
    } catch (error) {
      console.error('Error showing ad:', error);
    } finally {
      // Navigate to the game even if ad fails
      setIsLoading(false);
      navigate(route);
    }
  };

  return { navigateToGame, isLoading };
}
