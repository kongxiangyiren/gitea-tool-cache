import { defineConfig } from 'tsdown';

export default defineConfig({
  dts: false,
  exports: false,
  // ...config options
  minify: true,
  platform: 'node',
  deps: {
    alwaysBundle: ['@actions/tool-cache', 'node-version-alias', 'axios']
  }
});
