
import { AdMob, AdOptions, BannerAdPluginEvents, AdMobBannerSize, BannerAdOptions, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Test IDs for development
const TEST_INTERSTITIAL_ID = {
  android: 'ca-app-pub-3940256099942544/1033173712',
  ios: 'ca-app-pub-3940256099942544/4411468910'
};

// Flag to track AdMob initialization status
let isAdMobInitialized = false;
let isInitializing = false;
let isInterstitialReady = false;
let isNativePlatform = false;

export const AdService = {
  initialize: async (): Promise<void> => {
    // Check if we're running on a native platform (Android or iOS)
    isNativePlatform = Capacitor.isNativePlatform();
    
    // Skip initialization if not on a native platform
    if (!isNativePlatform) {
      console.log('Not running on native platform, skipping AdMob initialization');
      return Promise.resolve();
    }
    
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
    // Skip if not on a native platform
    if (!isNativePlatform) {
      return Promise.resolve();
    }
    
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
          const platform = Capacitor.getPlatform() as 'android' | 'ios';
          
          const options: AdOptions = {
            adId: TEST_INTERSTITIAL_ID[platform], // Get correct platform ID
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
