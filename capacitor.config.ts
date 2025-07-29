import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vesper.app',
  appName: 'Vesper',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;

npm install @capacitor/action-sheet
npx cap sync