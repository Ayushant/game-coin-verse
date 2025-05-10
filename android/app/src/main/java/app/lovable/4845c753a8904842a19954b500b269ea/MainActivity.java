
package app.lovable.4845c753a8904842a19954b500b269ea;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import app.lovable.unityads.UnityAdsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UnityAdsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
