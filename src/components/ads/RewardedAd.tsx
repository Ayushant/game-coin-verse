
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import AdService from '@/services/AdService';

interface RewardedAdProps {
  buttonText?: string;
  className?: string;
  onRewarded?: (reward: { type: string; amount: number }) => void;
  onAdDismissed?: () => void;
  onAdFailed?: (error: any) => void;
}

const RewardedAd: React.FC<RewardedAdProps> = ({
  buttonText = 'Watch Ad for Reward',
  className = '',
  onRewarded,
  onAdDismissed,
  onAdFailed,
}) => {
  const [loading, setLoading] = useState(false);

  const showAd = useCallback(async () => {
    setLoading(true);
    try {
      await AdService.prepareRewarded();
      const reward = await AdService.showRewarded();
      if (reward && onRewarded) {
        onRewarded(reward);
      }
      if (onAdDismissed) onAdDismissed();
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      if (onAdFailed) onAdFailed(error);
    } finally {
      setLoading(false);
    }
  }, [onRewarded, onAdDismissed, onAdFailed]);

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

export default RewardedAd;
