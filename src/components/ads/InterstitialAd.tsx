
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AdService from '@/services/AdService';

interface InterstitialAdProps {
  buttonText?: string;
  className?: string;
  onAdDismissed?: () => void;
  onAdFailed?: (error: any) => void;
}

const InterstitialAd: React.FC<InterstitialAdProps> = ({
  buttonText = 'Show Ad',
  className = '',
  onAdDismissed,
  onAdFailed,
}) => {
  const [loading, setLoading] = useState(false);
  const [adInitialized, setAdInitialized] = useState(false);
  
  // Initialize AdMob when component mounts
  useEffect(() => {
    const initAds = async () => {
      try {
        await AdService.initialize();
        setAdInitialized(true);
      } catch (error) {
        console.warn('Failed to initialize ads:', error);
        setAdInitialized(false);
      }
    };
    
    initAds();
  }, []);

  const showAd = useCallback(async () => {
    if (!adInitialized) {
      try {
        await AdService.initialize();
        setAdInitialized(true);
      } catch (error) {
        if (onAdFailed) onAdFailed(error);
        return;
      }
    }
    
    setLoading(true);
    try {
      await AdService.showGameEntryAd();
      if (onAdDismissed) onAdDismissed();
    } catch (error) {
      console.warn('Failed to show interstitial ad:', error);
      if (onAdFailed) onAdFailed(error);
    } finally {
      setLoading(false);
    }
  }, [onAdDismissed, onAdFailed, adInitialized]);

  return (
    <Button 
      className={className} 
      onClick={showAd} 
      disabled={loading}
    >
      {loading ? 'Loading...' : buttonText}
    </Button>
  );
};

export default InterstitialAd;
