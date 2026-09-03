import { defineConfig } from 'tsdown';

export default defineConfig({
  dts: false,
  exports: false,
  // ...config options
  // minify: true,
  platform: 'node',
  deps: {
    onlyBundle: false,
    // 打包所有依赖，全部内联进单个输出文件
    alwaysBundle: [/.*/]
  },
  shims: true,
  outputOptions: {
    // 将动态 import() 的 chunk 也内联进主文件，保证只输出单个文件
    codeSplitting: false,
    // 移除所有注释
    comments: false
  }
});
