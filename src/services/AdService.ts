
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdOptions, RewardAdOptions } from '@capacitor-community/admob';

// Test IDs for development - replace with actual IDs for production
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

// Actual production IDs - replace these with your actual ad unit IDs
const BANNER_ID = {
  android: TEST_BANNER_ID,
  ios: TEST_BANNER_ID
};
const INTERSTITIAL_ID = {
  android: 'ca-app-pub-3577415915119257/YOUR_INTERSTITIAL_ID',
  ios: 'ca-app-pub-3577415915119257/YOUR_INTERSTITIAL_ID'
};
const REWARDED_ID = {
  android: TEST_REWARDED_ID,
  ios: TEST_REWARDED_ID
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
    }
  },

  // Show Banner Ad
  showBanner: async (position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> => {
    try {
      if (!isAdMobInitialized) {
        await AdService.initialize();
      }
      
      const options: BannerAdOptions = {
        adId: BANNER_ID[getPlatform()],
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position,
        margin: 0,
      };
      await AdMob.showBanner(options);
    } catch (error) {
      console.error('Error showing banner ad:', error);
    }
  },

  // Hide Banner Ad
  hideBanner: async (): Promise<void> => {
    try {
      await AdMob.hideBanner();
    } catch (error) {
      console.error('Error hiding banner ad:', error);
    }
  },

  // Prepare and show an interstitial ad (combined for easier use)
  showGameEntryAd: async (): Promise<void> => {
    try {
      if (!isAdMobInitialized) {
        await AdService.initialize();
      }
      
      const options: AdOptions = {
        adId: INTERSTITIAL_ID[getPlatform()],
      };
      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
    } catch (error) {
      console.error('Error showing game entry ad:', error);
      // Continue execution even if ad fails
    }
  },

  // Prepare Interstitial Ad
  prepareInterstitial: async (): Promise<void> => {
    try {
      if (!isAdMobInitialized) {
        await AdService.initialize();
      }
      
      const options: AdOptions = {
        adId: INTERSTITIAL_ID[getPlatform()],
      };
      await AdMob.prepareInterstitial(options);
    } catch (error) {
      console.error('Error preparing interstitial ad:', error);
    }
  },

  // Show Interstitial Ad
  showInterstitial: async (): Promise<void> => {
    try {
      await AdMob.showInterstitial();
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
    }
  },

  // Prepare Rewarded Ad
  prepareRewarded: async (): Promise<void> => {
    try {
      if (!isAdMobInitialized) {
        await AdService.initialize();
      }
      
      const options: RewardAdOptions = {
        adId: REWARDED_ID[getPlatform()],
      };
      await AdMob.prepareRewardVideoAd(options);
    } catch (error) {
      console.error('Error preparing rewarded ad:', error);
    }
  },

  // Show Rewarded Ad - with proper type handling
  showRewarded: async (): Promise<{ type: string; amount: number } | null> => {
    try {
      const result = await AdMob.showRewardVideoAd();
      
      // Extract reward information based on the actual structure returned by the AdMob plugin
      if (result && 'reward' in result) {
        const rewardData = result.reward as Record<string, any>;
        if (rewardData && typeof rewardData === 'object') {
          return {
            type: typeof rewardData.type === 'string' ? rewardData.type : 'coins',
            amount: typeof rewardData.amount === 'number' ? rewardData.amount : 10
          };
        }
      }
      
      // Return default values if the structure doesn't match exactly what we expect
      return {
        type: 'coins',
        amount: 10
      };
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      return null;
    }
  },
};

export default AdService;
