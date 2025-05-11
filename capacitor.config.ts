
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.winwitty',
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
      }
    }
  }
};

export default config;
