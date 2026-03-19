import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.steiiin.dokudongle',
  appName: 'dokudongle',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      backgroundColor: "#000000"
    }
  }
};

export default config;
