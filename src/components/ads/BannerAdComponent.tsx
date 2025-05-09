
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
  const isAndroid = Capacitor.getPlatform() === 'android';
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Only run when component is mounted and DOM is ready
    if (!adRef.current) return;
    
    // Wait a moment to ensure the container has proper dimensions
    const timer = setTimeout(() => {
      try {
        // Create the ad element
        const adInsElement = document.createElement('ins');
        adInsElement.className = 'adsbygoogle';
        adInsElement.style.display = 'inline-block';
        adInsElement.style.width = '100%';
        adInsElement.style.height = '90px';
        adInsElement.setAttribute('data-ad-client', adClient);
        adInsElement.setAttribute('data-ad-slot', adSlot);
        
        // Clear the container and append the ad
        if (adRef.current) {
          adRef.current.innerHTML = '';
          adRef.current.appendChild(adInsElement);
          
          // Push the ad - using window object explicitly
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          setIsLoaded(true);
          
          console.log('Banner ad initialized with explicit dimensions');
        }
      } catch (error) {
        console.error('Error initializing banner ad:', error);
      }
    }, 500); // Small delay to ensure container is properly rendered
    
    return () => clearTimeout(timer);
  }, [adClient, adSlot]);

  // Don't render anything on non-supported platforms
  if (!isAndroid && Capacitor.isNativePlatform()) return null;

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
