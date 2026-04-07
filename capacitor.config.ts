import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.samarth.billing',
  appName: 'billing-software',
  webDir: 'build',
  ios: {
    contentInset: 'automatic',
  },
};

export default config;