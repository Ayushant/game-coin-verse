
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AdService from '@/services/AdService';

/**
 * Hook to handle game navigation with interstitial ads
 */
export function useGameNavigation() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToGame = async (route: string) => {
    setIsLoading(true);
    try {
      try {
        // Try to show an ad before navigating
        await AdService.showGameEntryAd();
      } catch (adError) {
        console.error('Ad could not be shown, continuing to game:', adError);
        // Continue to the game even if ad fails
      }
    } catch (error) {
      console.error('Error navigating to game:', error);
    } finally {
      // Navigate to the game regardless of ad success
      setIsLoading(false);
      navigate(route);
    }
  };

  return { navigateToGame, isLoading };
}
