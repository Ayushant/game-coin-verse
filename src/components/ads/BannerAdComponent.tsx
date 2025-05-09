
import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Card } from '@/components/ui/card';

interface BannerAdComponentProps {
  className?: string;
  adClient?: string;
  adSlot?: string;
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  className = '',
  adClient = 'ca-pub-3577415915119257',
  adSlot = '7271840531'
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const uniqueId = useRef(`ad-${Math.random().toString(36).substring(2, 9)}`);
  
  useEffect(() => {
    // Only try to load ads in browser environments
    if (typeof window === 'undefined') return;
    
    const loadAd = () => {
      try {
        if (!adRef.current) return;
        
        // Safely clean up previous content
        adRef.current.innerHTML = '';
        
        // Create ad element with unique ID to avoid conflicts
        const adInsElement = document.createElement('ins');
        adInsElement.id = uniqueId.current;
        adInsElement.className = 'adsbygoogle';
        adInsElement.style.display = 'block';
        adInsElement.style.width = '100%';
        adInsElement.style.height = '90px';
        adInsElement.setAttribute('data-ad-client', adClient);
        adInsElement.setAttribute('data-ad-slot', adSlot);
        
        // Append the ad to container
        adRef.current.appendChild(adInsElement);
        
        // Push the ad command
        try {
          if (window.adsbygoogle) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log('Banner ad pushed to queue');
            setIsLoaded(true);
          }
        } catch (pushError) {
          console.error('Error pushing ad to queue:', pushError);
        }
      } catch (error) {
        console.error('Error initializing banner ad:', error);
      }
    };
    
    // Short delay to ensure React rendering is complete
    const timer = setTimeout(loadAd, 200);
    
    return () => {
      clearTimeout(timer);
      
      // Safe cleanup - use innerHTML rather than removeChild
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, [adClient, adSlot]);

  // Don't render on non-supported platforms
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() !== 'android') return null;

  return (
    <Card className={`p-2 overflow-hidden ${className}`}>
      <div 
        ref={adRef}
        className="min-h-[90px] w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        {!isLoaded && <p className="text-gray-400 text-xs">Advertisement</p>}
      </div>
    </Card>
  );
};

export default BannerAdComponent;
