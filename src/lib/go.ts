import { join } from 'path';
import { downloadTool, extractZip, extractTar, extractXar, cacheDir } from '@actions/tool-cache';
import { addPath, getInput } from '@actions/core';
import { arch, platform as Platform } from 'os';
import { existsSync, renameSync } from 'fs';

// 安装golang
export async function goInstall() {
  const platform = Platform();
  const goVersion = getInput('go-version');
  if (!goVersion) {
    console.log('没有go-version,跳过go安装');
    return;
  }
  if (
    process.env['RUNNER_TOOL_CACHE'] &&
    existsSync(join(process.env['RUNNER_TOOL_CACHE'], 'go', goVersion, arch()))
  ) {
    console.log('go已经安装过了');

    return;
  }

  if (platform === 'win32') {
    console.log(`https://golang.google.cn/dl/go${goVersion}.windows-amd64.zip`);

    const goPath = await downloadTool(
      `https://golang.google.cn/dl/go${goVersion}.windows-amd64.zip`
    );
    renameSync(goPath, goPath + '.zip');
    const goExtractedFolder = await extractZip(goPath + '.zip', './cache/go');
    const cachedPath = await cacheDir(join(goExtractedFolder, 'go'), 'go', goVersion);
    addPath(cachedPath);
  } else if (platform === 'darwin') {
    console.log('没有mac,暂未测试');
  } else {
    console.log(`https://golang.google.cn/dl/go${goVersion}.linux-amd64.tar.gz`);

    const goPath = await downloadTool(
      `https://golang.google.cn/dl/go${goVersion}.linux-amd64.tar.gz`
    );
    const goExtractedFolder = await extractTar(goPath, './cache/go');

    const cachedPath = await cacheDir(join(goExtractedFolder, 'go'), 'go', goVersion);
    addPath(cachedPath);
  }
}
