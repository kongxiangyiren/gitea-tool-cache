import { nodeInstall, goInstall, dotnetInstall } from './lib';

function run() {
  // 不加await会并行执行,加快速度
  nodeInstall();
  goInstall();
  dotnetInstall();
}
run();
