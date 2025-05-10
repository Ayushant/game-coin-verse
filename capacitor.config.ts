
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4845c753a8904842a199-54b500b269ea',
  appName: 'WinWitty',
  webDir: 'dist',
  server: {
    url: 'https://4845c753-a890-4842-a199-54b500b269ea.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: null,
      keystoreAlias: null,
      minSdkVersion: 21,
      targetSdkVersion: 33,
      compileSdkVersion: 33
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'WinWitty',
    backgroundColor: '#6b46c1'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6b46c1",
      showSpinner: true,
      spinnerColor: "#ffffff"
    },
    CapacitorScreenOrientation: {
      lockOrientationToPortrait: true
    },
    AdMob: {
      // These are test app IDs from AdMob documentation
      appId: {
        ios: "ca-app-pub-3940256099942544~1458002511",
        android: "ca-app-pub-3940256099942544~3347511713"
      },
      // For mediation support, we only need to configure AdMob
      // Unity Ads is configured in the AdMob dashboard
    }
  }
};

export default config;
