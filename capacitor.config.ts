import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.steiiin.dokudongle',
  appName: 'DokuDongle',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      backgroundColor: "#000000"
    }
  }
};

export default config;
