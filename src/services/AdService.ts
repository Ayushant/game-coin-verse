
import { AdMob, AdOptions } from '@capacitor-community/admob';

// Test IDs for development - replace with actual IDs for production
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

// Actual production IDs - replace these with your actual ad unit IDs
const INTERSTITIAL_ID = {
  android: TEST_INTERSTITIAL_ID, // Using test ID for safety
  ios: TEST_INTERSTITIAL_ID // Using test ID for safety
};

// Function to determine which platform we're running on
const getPlatform = (): 'android' | 'ios' => {
  const userAgent = navigator.userAgent || navigator.vendor;
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  return 'ios';
};

// Flag to track AdMob initialization status
let isAdMobInitialized = false;
let isInitializing = false;
let isInterstitialReady = false;

export const AdService = {
  initialize: async (): Promise<void> => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing) {
      return new Promise((resolve) => {
        const checkInit = setInterval(() => {
          if (isAdMobInitialized) {
            clearInterval(checkInit);
            resolve();
          }
        }, 200);
      });
    }
    
    // Return early if already initialized
    if (isAdMobInitialized) {
      return Promise.resolve();
    }
    
    isInitializing = true;
    
    try {
      // Initialize AdMob with correct options
      await AdMob.initialize({
        // Test mode for safety
        testingDevices: ['EMULATOR'],
        initializeForTesting: true,
      });
      
      isAdMobInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Error initializing AdMob:', error);
      // Don't throw - we'll try again later if needed
    } finally {
      isInitializing = false;
    }
  },

  // Prepare and show an interstitial ad with error handling
  showGameEntryAd: async (): Promise<void> => {
    try {
      // Initialize AdMob if not already initialized
      if (!isAdMobInitialized) {
        try {
          await AdService.initialize();
        } catch (initError) {
          console.error('Failed to initialize AdMob:', initError);
          return; // Continue without showing ad
        }
      }
      
      // Only try to prepare if we're reasonably sure AdMob is available
      if (isAdMobInitialized) {
        try {
          const options: AdOptions = {
            adId: TEST_INTERSTITIAL_ID, // Always use test ID for safety
          };
          
          // Prepare the ad
          await AdMob.prepareInterstitial(options);
          isInterstitialReady = true;
          
          // Show the ad
          await AdMob.showInterstitial();
          isInterstitialReady = false;
        } catch (adError) {
          console.warn('Ad could not be shown:', adError);
          // Do not throw - continue app function even if ad fails
          isInterstitialReady = false;
        }
      }
    } catch (error) {
      console.warn('Error in ad service:', error);
      // Do not throw - app should continue even if ad service fails
    }
  },
};

export default AdService;
