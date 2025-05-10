
#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin in Objective-C
CAP_PLUGIN(UnityAdsPlugin, "UnityAdsPlugin",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(loadRewardedAd, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(showRewardedAd, CAPPluginReturnPromise);
)
