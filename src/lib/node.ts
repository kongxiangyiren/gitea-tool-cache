import { join } from 'path';
import { downloadTool, extractZip, extractTar, extractXar, cacheDir } from '@actions/tool-cache';
import { addPath, getInput, setOutput } from '@actions/core';
import { arch, platform as Platform } from 'os';
import { existsSync, renameSync } from 'fs';
import { nodeVersionAlias } from 'gitea-tool-cache-version-alias';

// 安装node
export async function nodeInstall() {
  const platform = Platform();
  const nodeVersion = getInput('node-version');
  if (!nodeVersion) {
    console.log('没有node-version,跳过node安装');
    return;
  }
  const version = await nodeVersionAlias(nodeVersion, {
    mirror: 'https://npmmirror.com/mirrors/node'
  }).catch(err => err);

  if (version instanceof Error) {
    console.log('node版本错误', version);
    return;
  }

  if (
    process.env['RUNNER_TOOL_CACHE'] &&
    existsSync(join(process.env['RUNNER_TOOL_CACHE'], 'node', version, arch()))
  ) {
    console.log('node已经安装过了');

    return setOutput('node-version', version);
  }

  if (platform === 'win32') {
    console.log(
      `https://registry.npmmirror.com/-/binary/node/v${version}/node-v${version}-win-${arch()}.zip`
    );

    const nodePath = await downloadTool(
      `https://registry.npmmirror.com/-/binary/node/v${version}/node-v${version}-win-${arch()}.zip`
    );

    renameSync(nodePath, nodePath + '.zip');

    const nodeExtractedFolder = await extractZip(nodePath + '.zip', './cache/node');
    const cachedPath = await cacheDir(
      join(nodeExtractedFolder, `node-v${version}-win-${arch()}`),
      'node',
      version
    );
    addPath(cachedPath);
    setOutput('node-version', version);
  } else if (platform === 'darwin') {
    console.log('没有mac,暂未测试');

    // const nodePath = await downloadTool(
    //   `https://registry.npmmirror.com/-/binary/node/v${version}/node-v${version}.pkg`
    // );
    // const nodeExtractedFolder = await extractXar(nodePath, './cache/node');
  } else {
    console.log(
      `https://registry.npmmirror.com/-/binary/node/v${version}/node-v${version}-linux-${arch()}.tar.gz`
    );

    const nodePath = await downloadTool(
      `https://registry.npmmirror.com/-/binary/node/v${version}/node-v${version}-linux-${arch()}.tar.gz`
    );
    const nodeExtractedFolder = await extractTar(nodePath, './cache/node');

    const cachedPath = await cacheDir(
      join(nodeExtractedFolder, `node-v${version}-linux-${arch()}`),
      'node',
      version
    );
    addPath(cachedPath);
    setOutput('node-version', version);
  }
}
