
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
    contentInset: 'automatic'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6b46c1",
      showSpinner: true,
      spinnerColor: "#ffffff"
    },
    // Mobile orientation settings for games
    CapacitorScreenOrientation: {
      lockOrientationToPortrait: true
    }
  }
};

export default config;
