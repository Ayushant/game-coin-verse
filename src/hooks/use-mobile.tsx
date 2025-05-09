
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkMobile = () => {
      // Check for touch capability as well as screen size
      const isTouchDevice = ('ontouchstart' in window) || 
        (navigator.maxTouchPoints > 0);
      
      const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
      
      setIsMobile(isSmallScreen || isTouchDevice);
    };
    
    // Initial check
    checkMobile();
    
    // Set up listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return !!isMobile;
}
