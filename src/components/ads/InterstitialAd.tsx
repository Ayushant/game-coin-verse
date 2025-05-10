
import React, { useState, useCallback } from 'react';
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

  const showAd = useCallback(async () => {
    setLoading(true);
    try {
      await AdService.showGameEntryAd();
      if (onAdDismissed) onAdDismissed();
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      if (onAdFailed) onAdFailed(error);
    } finally {
      setLoading(false);
    }
  }, [onAdDismissed, onAdFailed]);

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
