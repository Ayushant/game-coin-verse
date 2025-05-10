
import React, { useEffect } from 'react';
import { BannerAdPosition } from '@capacitor-community/admob';
import AdService from '@/services/AdService';

interface BannerAdProps {
  position?: BannerAdPosition;
  show?: boolean;
}

const BannerAd: React.FC<BannerAdProps> = ({
  position = BannerAdPosition.BOTTOM_CENTER,
  show = true,
}) => {
  useEffect(() => {
    const handleAd = async () => {
      try {
        if (show) {
          await AdService.showBanner(position);
        } else {
          await AdService.hideBanner();
        }
      } catch (error) {
        console.error('Banner ad error:', error);
      }
    };

    handleAd();

    // Cleanup on component unmount
    return () => {
      AdService.hideBanner().catch(console.error);
    };
  }, [position, show]);

  // This component doesn't render anything visible in the React tree
  return null;
};

export default BannerAd;
