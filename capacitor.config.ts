
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4845c753a8904842a19954b500b269ea',
  appName: 'game-coin-verse',
  webDir: 'dist',
  server: {
    url: 'https://4845c753-a890-4842-a199-54b500b269ea.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorAdMob: {
      appId: 'ca-app-pub-3577415915119257~8633023667',
      nativeAdOptions: {
        adSize: 'MEDIUM_RECTANGLE'
      }
    }
  },
  android: {
    buildOptions: {
      keystorePath: null,
      keystoreAlias: null
    }
  }
};

export default config;
