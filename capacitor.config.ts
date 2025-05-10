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
      keystoreAlias: null
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
    // Fix Unity Ads plugin config to make it simpler
    UnityAdsPlugin: {
      gameId: "5851223",
      testMode: false
    }
  },
  // Keep the cordova preferences for backward compatibility
  cordova: {
    preferences: {
      UNITY_GAME_ID: "5851223"
    }
  }
};

export default config;
