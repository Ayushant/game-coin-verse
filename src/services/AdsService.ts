
import { supabase } from '@/integrations/supabase/client';
import { registerPlugin } from '@capacitor/core';

// Define the plugin interface
interface UnityAdsPlugin {
  initialize: (options: { gameId: string, testMode: boolean }) => Promise<{ success: boolean }>;
  loadRewardedAd: (options: { placementId: string }) => Promise<{ success: boolean }>;
  showRewardedAd: (options: { placementId: string }) => Promise<{ 
    success: boolean; 
    completed: boolean;
    skipped: boolean;
  }>;
}

// Register the plugin with Capacitor
const UnityAds = registerPlugin<UnityAdsPlugin>('UnityAdsPlugin');

// This will check if we're in a Capacitor environment (mobile app)
const isMobileApp = () => {
  return window.location.href.includes('capacitor://') || 
         window.location.href.includes('forceHideBadge=true');
};

export const AdsService = {
  /**
   * Initialize the Unity Ads SDK
   */
  async initialize(): Promise<boolean> {
    try {
      // Only initialize in mobile environment
      if (!isMobileApp()) {
        console.log('Not in mobile environment, skipping ad initialization');
        return false;
      }
      
      try {
        const { success } = await UnityAds.initialize({
          gameId: '5851223',  // Your Unity Game ID
          testMode: false     // Set to false for production
        });
        
        return success;
      } catch (error) {
        console.error('Error initializing Unity Ads:', error);
        return false;
      }
    } catch (error) {
      console.error('Error initializing Unity Ads:', error);
      return false;
    }
  },
  
  /**
   * Show a rewarded ad and award coins if watched
   */
  async showRewardedAd(userId: string): Promise<{ 
    success: boolean;
    watched: boolean;
  }> {
    try {
      // Skip ads in web environment
      if (!isMobileApp()) {
        console.log('Not in mobile environment, skipping ad');
        return { success: true, watched: false };
      }
      
      try {
        // Load the ad first
        const loadResult = await UnityAds.loadRewardedAd({
          placementId: 'Rewarded_Android'
        });
        
        if (!loadResult.success) {
          console.log('Failed to load rewarded ad');
          return { success: false, watched: false };
        }
        
        // Show the ad
        const result = await UnityAds.showRewardedAd({
          placementId: 'Rewarded_Android'
        });
        
        // Award coins if the ad was completed or skipped
        if (result.success && (result.completed || result.skipped)) {
          const coinAmount = 10; // Base amount of coins to award
          
          try {
            // Using the RPC function to update user coins
            const { error } = await supabase.rpc('update_user_coins', {
              user_id: userId,
              coin_amount: coinAmount
            });
            
            if (error) {
              console.error('Error updating coins after ad:', error);
            } else {
              // Log reward
              await supabase.from('rewards').insert({
                user_id: userId,
                coins: coinAmount,
                action: 'ad_reward'
              });
            }
          } catch (error) {
            console.error('Error updating coins after ad:', error);
          }
          
          return { success: true, watched: result.completed };
        }
        
        return { 
          success: result.success, 
          watched: result.completed || false 
        };
      } catch (error) {
        console.error('Error showing rewarded ad:', error);
        return { success: false, watched: false };
      }
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      return { success: false, watched: false };
    }
  }
};
