
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdService from '@/services/AdService';

/**
 * Hook to handle game navigation with interstitial ads
 */
export function useGameNavigation() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdInitialized, setIsAdInitialized] = useState(false);

  // Initialize AdMob when the hook is first used
  useEffect(() => {
    const initAds = async () => {
      try {
        await AdService.initialize();
        setIsAdInitialized(true);
      } catch (error) {
        console.warn('Ad initialization failed:', error);
        // Continue without ads
        setIsAdInitialized(true);
      }
    };
    
    initAds();
  }, []);

  const navigateToGame = async (route: string) => {
    setIsLoading(true);
    
    // Short timeout to ensure UI updates before potentially blocking operations
    setTimeout(async () => {
      try {
        if (isAdInitialized) {
          try {
            // Try to show an ad before navigating
            await AdService.showGameEntryAd();
          } catch (adError) {
            console.warn('Ad display failed:', adError);
            // Continue to game even if ad fails
          }
        }
      } catch (error) {
        console.warn('Navigation error:', error);
      } finally {
        // Navigate to the game regardless of ad success
        setIsLoading(false);
        navigate(route);
      }
    }, 100);
  };

  return { navigateToGame, isLoading };
}
