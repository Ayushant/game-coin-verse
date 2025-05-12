
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
      minSdkVersion: 22, // Increased from 21 for better compatibility
      targetSdkVersion: 33,
      compileSdkVersion: 33
    }
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
    }
  }
};

export default config;
