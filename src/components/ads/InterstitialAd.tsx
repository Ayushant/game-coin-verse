
import React from 'react';
import { Button } from '@/components/ui/button';

// This is now a simple button component that replaced the ad functionality
interface InterstitialAdProps {
  buttonText?: string;
  className?: string;
  onAdDismissed?: () => void;
  onAdFailed?: (error: any) => void;
}

const InterstitialAd: React.FC<InterstitialAdProps> = ({
  buttonText = 'Continue',
  className = '',
  onAdDismissed,
}) => {
  const handleClick = () => {
    // Just trigger the callback without showing ads
    if (onAdDismissed) onAdDismissed();
  };

  return (
    <Button 
      className={className} 
      onClick={handleClick}
    >
      {buttonText}
    </Button>
  );
};

export default InterstitialAd;
