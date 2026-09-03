import { setFailed } from '@actions/core';
import { nodeInstall, goInstall, dotnetInstall } from './lib';
import { formatError } from './lib/common';

async function run() {
  // 并行安装；各 lib 内部已自行 catch 并 setFailed，不会向外抛异常。
  // 万一有意外的 reject，由外层 catch 兜底，保证进程不会带着 unhandledRejection 退出。
  await Promise.all([nodeInstall(), goInstall(), dotnetInstall()]);
}

run().catch(err => {
  setFailed(formatError(err));
});
