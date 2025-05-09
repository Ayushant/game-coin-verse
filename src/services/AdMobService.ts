
import { Capacitor } from '@capacitor/core';
import { AdMob, AdOptions, AdLoadInfo, AdMobRewardItem, RewardAdOptions, AdMobBannerSize } from '@capacitor-community/admob';

class AdMobService {
  private initialized = false;
  private isAndroid = Capacitor.getPlatform() === 'android';

  constructor() {
    // Only initialize on Android platform
    if (this.isAndroid) {
      this.initialize();
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized || !this.isAndroid) return;

    try {
      await AdMob.initialize({
        requestTrackingAuthorization: false,
        testingDevices: ['EMULATOR'],
        initializeForTesting: true,
      });
      
      this.initialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Error initializing AdMob:', error);
    }
  }

  async showNativeAd(adUnitId: string, containerSelector: string): Promise<void> {
    if (!this.isAndroid) return;
    
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const options = {
        adId: adUnitId,
        nativeAdOptions: {
          adSize: AdMobBannerSize.MEDIUM_RECTANGLE,
        },
      };
      
      // Find the container element
      const container = document.querySelector(containerSelector);
      if (!container) {
        console.error('Ad container not found:', containerSelector);
        return;
      }
      
      // Load ad
      await AdMob.prepareInterstitial({
        adId: adUnitId,
      });
      
      const adLoadInfo = await AdMob.loadInterstitial();
      
      // Style the container
      container.classList.add('ad-container');
      container.innerHTML = '<div class="ad-placeholder">Advertisement</div>';
      
      // Show ad
      await AdMob.showInterstitial();
      console.log('Ad shown successfully');
      
    } catch (error) {
      console.error('Error showing native ad:', error);
    }
  }

  isAvailable(): boolean {
    return this.isAndroid && this.initialized;
  }
}

export const adMobService = new AdMobService();
