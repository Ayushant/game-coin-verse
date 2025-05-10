
package app.lovable.unityads;

import android.app.Activity;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.unity3d.ads.IUnityAdsInitializationListener;
import com.unity3d.ads.IUnityAdsLoadListener;
import com.unity3d.ads.IUnityAdsShowListener;
import com.unity3d.ads.UnityAds;
import com.unity3d.ads.UnityAdsShowOptions;

@CapacitorPlugin(name = "UnityAdsPlugin")
public class UnityAdsPlugin extends Plugin implements IUnityAdsInitializationListener {
    private static final String TAG = "UnityAdsPlugin";

    @PluginMethod
    public void initialize(final PluginCall call) {
        try {
            String gameId = call.getString("gameId");
            boolean testMode = call.getBoolean("testMode", false);

            if (gameId == null) {
                call.reject("Game ID is required");
                return;
            }

            getActivity().runOnUiThread(() -> {
                UnityAds.initialize(getContext(), gameId, testMode, this);
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            });
        } catch (Exception e) {
            Log.e(TAG, "Error initializing Unity Ads", e);
            call.reject("Failed to initialize Unity Ads: " + e.getMessage());
        }
    }

    @PluginMethod
    public void loadRewardedAd(final PluginCall call) {
        try {
            String placementId = call.getString("placementId", "Rewarded_Android");

            getActivity().runOnUiThread(() -> {
                UnityAds.load(placementId, new IUnityAdsLoadListener() {
                    @Override
                    public void onUnityAdsAdLoaded(String placementId) {
                        JSObject result = new JSObject();
                        result.put("success", true);
                        result.put("placementId", placementId);
                        call.resolve(result);
                    }

                    @Override
                    public void onUnityAdsFailedToLoad(String placementId, UnityAds.UnityAdsLoadError error, String message) {
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("error", error.toString());
                        result.put("message", message);
                        call.resolve(result);
                    }
                });
            });
        } catch (Exception e) {
            Log.e(TAG, "Error loading rewarded ad", e);
            call.reject("Failed to load rewarded ad: " + e.getMessage());
        }
    }

    @PluginMethod
    public void showRewardedAd(final PluginCall call) {
        try {
            String placementId = call.getString("placementId", "Rewarded_Android");
            Activity activity = getActivity();

            if (activity == null) {
                call.reject("Activity is null");
                return;
            }

            activity.runOnUiThread(() -> {
                UnityAds.show(activity, placementId, new UnityAdsShowOptions(), new IUnityAdsShowListener() {
                    @Override
                    public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error, String message) {
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("error", error.toString());
                        result.put("message", message);
                        call.resolve(result);
                    }

                    @Override
                    public void onUnityAdsShowStart(String placementId) {
                        // Ad started
                    }

                    @Override
                    public void onUnityAdsShowClick(String placementId) {
                        // Ad clicked
                    }

                    @Override
                    public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsShowCompletionState state) {
                        JSObject result = new JSObject();
                        result.put("success", true);
                        result.put("completed", state == UnityAds.UnityAdsShowCompletionState.COMPLETED);
                        result.put("skipped", state == UnityAds.UnityAdsShowCompletionState.SKIPPED);
                        call.resolve(result);
                    }
                });
            });
        } catch (Exception e) {
            Log.e(TAG, "Error showing rewarded ad", e);
            call.reject("Failed to show rewarded ad: " + e.getMessage());
        }
    }

    @Override
    public void onInitializationComplete() {
        Log.d(TAG, "Unity Ads initialization complete");
    }

    @Override
    public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
        Log.e(TAG, "Unity Ads initialization failed: " + error + " - " + message);
    }
}
