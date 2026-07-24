import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'club.attak',
  appName: 'Attak',
  webDir: 'build',
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
