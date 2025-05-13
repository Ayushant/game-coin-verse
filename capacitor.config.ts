
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.winwitty',
  appName: 'WinWitty',
  webDir: 'dist',
  // Remove the server URL configuration to use the bundled web assets instead
  android: {
    buildOptions: {
      keystorePath: null,
      keystoreAlias: null,
      minSdkVersion: 22,
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
