import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.steiiin.dokudongle',
  appName: 'DokuDongle',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      backgroundColor: "#1e1e1e",
      launchAutoHide: false,
    },
    SystemBars: {
      insetsHandling: "disable",
    },
    Keyboard: {
      resizeOnFullScreen: false
    },
    EdgeToEdge: {
      backgroundColor: "#1e1e1e",
      navigationBarColor: "#1e1e1e",
      statusBarColor: "#1e1e1e",
    },
  }
};

export default config;
