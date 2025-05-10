
import { useEffect, useState } from 'react';
import AdService from '@/services/AdService';

/**
 * Hook to manage showing an interstitial ad on app startup
 * @returns {boolean} readyToShow - Whether the app is ready to show content after the ad
 */
export const useStartupAd = (): boolean => {
  const [adShown, setAdShown] = useState<boolean>(false);
  const [readyToShow, setReadyToShow] = useState<boolean>(false);

  useEffect(() => {
    // Only show the ad once when the component mounts
    const showStartupAd = async () => {
      try {
        // First initialize AdMob if not already done
        await AdService.initialize();
        
        // Prepare and show the interstitial ad
        await AdService.prepareInterstitial();
        await AdService.showInterstitial();
      } catch (error) {
        console.error('Failed to show startup ad:', error);
      } finally {
        // Mark the ad as shown regardless of success/failure
        setAdShown(true);
        setReadyToShow(true);
      }
    };

    if (!adShown) {
      showStartupAd();
    }
  }, [adShown]);

  return readyToShow;
};
