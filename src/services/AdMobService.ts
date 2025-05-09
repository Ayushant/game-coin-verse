
import { Capacitor } from '@capacitor/core';
import { AdMob, AdOptions, AdLoadInfo, AdMobRewardItem, RewardAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

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
        // requestTrackingAuthorization is not a valid option
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
      
      // Find the container element
      const container = document.querySelector(containerSelector);
      if (!container) {
        console.error('Ad container not found:', containerSelector);
        return;
      }
      
      // Style the container
      container.classList.add('ad-container');
      container.innerHTML = '<div class="ad-placeholder">Advertisement</div>';
      
      // For native ads, we'll use interstitial as a workaround
      // since native ads aren't directly supported in the same way
      const options = {
        adId: adUnitId,
      };
      
      // Prepare and show interstitial ad
      await AdMob.prepareInterstitial(options);
      
      // Show the interstitial when it's ready
      await AdMob.showInterstitial();
      console.log('Ad shown successfully');
      
    } catch (error) {
      console.error('Error showing ad:', error);
    }
  }
  
  async showBanner(adUnitId: string): Promise<void> {
    if (!this.isAndroid) return;
    
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Prepare and show banner ad
      await AdMob.showBanner({
        adId: adUnitId,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
      });
      
      console.log('Banner ad shown successfully');
    } catch (error) {
      console.error('Error showing banner ad:', error);
    }
  }
  
  async hideBanner(): Promise<void> {
    if (!this.isAndroid) return;
    
    try {
      await AdMob.hideBanner();
      console.log('Banner ad hidden');
    } catch (error) {
      console.error('Error hiding banner ad:', error);
    }
  }

  isAvailable(): boolean {
    return this.isAndroid && this.initialized;
  }
}

export const adMobService = new AdMobService();
