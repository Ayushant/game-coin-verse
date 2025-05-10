
package app.lovable.4845c753a8904842a19954b500b269ea;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.community.admob.AdMob;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register AdMob plugin
        registerPlugin(AdMob.class);
    }
}
