
import { AdMob, AdOptions } from '@capacitor-community/admob';

// Test IDs for development - replace with actual IDs for production
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

// Actual production IDs - replace these with your actual ad unit IDs
const INTERSTITIAL_ID = {
  android: 'ca-app-pub-3577415915119257/YOUR_INTERSTITIAL_ID',
  ios: 'ca-app-pub-3577415915119257/YOUR_INTERSTITIAL_ID'
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
let isInterstitialReady = false;

export const AdService = {
  initialize: async (): Promise<void> => {
    try {
      // Check if AdMob is already initialized
      if (isAdMobInitialized) {
        console.log('AdMob already initialized');
        return;
      }
      
      // Initialize AdMob with correct options
      await AdMob.initialize({
        // testingDevices is an array of device IDs that will always receive test ads
        testingDevices: ['EMULATOR'],
        // Set to true during development to show test ads
        initializeForTesting: true,
      });
      
      isAdMobInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Error initializing AdMob:', error);
      throw error;
    }
  },

  // Prepare and show an interstitial ad (combined for easier use)
  showGameEntryAd: async (): Promise<void> => {
    try {
      if (!isAdMobInitialized) {
        await AdService.initialize();
      }
      
      // Prepare the interstitial ad
      try {
        if (!isInterstitialReady) {
          const options: AdOptions = {
            adId: INTERSTITIAL_ID[getPlatform()],
          };
          await AdMob.prepareInterstitial(options);
          isInterstitialReady = true;
        }
        
        // Show the interstitial ad
        await AdMob.showInterstitial();
        
        // Reset flag after showing
        isInterstitialReady = false;
      } catch (adError) {
        console.error('Error preparing or showing interstitial ad:', adError);
        // Mark as not ready so we can try again next time
        isInterstitialReady = false;
        throw adError;
      }
    } catch (error) {
      console.error('Error in showGameEntryAd:', error);
      // Rethrow to let caller handle it
      throw error;
    }
  },
};

export default AdService;
