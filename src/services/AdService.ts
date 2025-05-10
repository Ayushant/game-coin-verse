
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
  android: TEST_INTERSTITIAL_ID,
  ios: TEST_INTERSTITIAL_ID
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

export const AdService = {
  initialize: async (): Promise<void> => {
    try {
      // Initialize AdMob with correct options
      await AdMob.initialize({
        // Remove requestTrackingAuthorization as it's not in the type definition
        testingDevices: ['EMULATOR'],
        initializeForTesting: true,
      });
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Error initializing AdMob:', error);
    }
  },

  // Show Banner Ad
  showBanner: async (position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> => {
    try {
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

  // Prepare Interstitial Ad
  prepareInterstitial: async (): Promise<void> => {
    try {
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
      const options: RewardAdOptions = {
        adId: REWARDED_ID[getPlatform()],
      };
      await AdMob.prepareRewardVideoAd(options);
    } catch (error) {
      console.error('Error preparing rewarded ad:', error);
    }
  },

  // Show Rewarded Ad - fixed to use the correct property structure
  showRewarded: async (): Promise<{ type: string; amount: number } | null> => {
    try {
      const result = await AdMob.showRewardVideoAd();
      // Extract reward information from the result
      if (result && typeof result === 'object' && 'type' in result && 'amount' in result) {
        return {
          type: result.type as string,
          amount: result.amount as number
        };
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
