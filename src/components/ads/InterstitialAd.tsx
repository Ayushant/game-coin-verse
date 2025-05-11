
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AdService from '@/services/AdService';
import { Capacitor } from '@capacitor/core';

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
  const isNativePlatform = Capacitor.isNativePlatform();
  
  // Initialize AdMob when component mounts
  useEffect(() => {
    // Skip initialization if not on a native platform
    if (!isNativePlatform) {
      setAdInitialized(true);
      return;
    }
    
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
  }, [isNativePlatform]);

  const showAd = useCallback(async () => {
    // Skip ad display if not on a native platform
    if (!isNativePlatform) {
      if (onAdDismissed) onAdDismissed();
      return;
    }
    
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
  }, [onAdDismissed, onAdFailed, adInitialized, isNativePlatform]);

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
