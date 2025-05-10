
package app.lovable.4845c753a8904842a19954b500b269ea;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

// Remove the import for UnityAdsPlugin as it's already being registered somewhere else
// import app.lovable.unityads.UnityAdsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Remove the plugin registration here as it's already registered elsewhere
        // registerPlugin(UnityAdsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
