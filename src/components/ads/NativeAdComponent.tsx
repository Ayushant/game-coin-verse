
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { adMobService } from '@/services/AdMobService';
import { Capacitor } from '@capacitor/core';

interface NativeAdComponentProps {
  className?: string;
}

const NativeAdComponent: React.FC<NativeAdComponentProps> = ({ className = '' }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);
  const adUnitId = 'ca-app-pub-3577415915119257/9752640007';

  useEffect(() => {
    // Only run on Android platform
    const checkPlatform = async () => {
      const platform = Capacitor.getPlatform();
      setIsAndroid(platform === 'android');
      
      if (platform === 'android') {
        try {
          await adMobService.showNativeAd(adUnitId, '#ad-container');
          setAdLoaded(true);
        } catch (error) {
          console.error('Failed to load ad:', error);
          setAdError(error instanceof Error ? error.message : 'Failed to load advertisement');
        }
      }
    };

    checkPlatform();
  }, []);

  // Don't render anything on non-Android platforms
  if (!isAndroid) return null;

  return (
    <Card className={`p-4 mb-4 ${className}`}>
      <div 
        id="ad-container" 
        className="min-h-[250px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
      >
        {!adLoaded && !adError && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading advertisement...</p>
        )}
        {adError && (
          <p className="text-red-500 dark:text-red-400 text-sm">{adError}</p>
        )}
      </div>
    </Card>
  );
};

export default NativeAdComponent;
