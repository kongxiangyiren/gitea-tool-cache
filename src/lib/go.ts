import { join } from 'path';
import { downloadTool, extractZip, extractTar, cacheDir, find } from '@actions/tool-cache';
import { addPath, getInput, info, setFailed } from '@actions/core';
import { arch, platform as Platform } from 'os';
import { renameSync } from 'fs';

// 安装golang
export async function goInstall() {
  const platform = Platform();
  const goVersion = getInput('go-version');
  if (!goVersion) {
    info('没有go-version,跳过go安装');
    return;
  }

  const goPath = find('go', goVersion, arch());

  if (goPath) {
    info('go已经安装过了');
    return;
  }
  const archD = arch() === 'x64' ? 'amd64' : arch();

  try {
    if (platform === 'win32') {
      info(`https://golang.google.cn/dl/go${goVersion}.windows-${archD}.zip`);

      const goPath = await downloadTool(
        `https://golang.google.cn/dl/go${goVersion}.windows-${archD}.zip`
      );
      renameSync(goPath, goPath + '.zip');
      const goExtractedFolder = await extractZip(goPath + '.zip', './cache/go');
      const cachedPath = await cacheDir(join(goExtractedFolder, 'go'), 'go', goVersion);
      addPath(cachedPath);
    } else if (platform === 'darwin') {
      info(`https://golang.google.cn/dl/go${goVersion}.darwin-${archD}.tar.gz`);

      const goPath = await downloadTool(
        `https://golang.google.cn/dl/go${goVersion}.darwin-${archD}.tar.gz`
      );
      const goExtractedFolder = await extractTar(goPath, './cache/go');

      const cachedPath = await cacheDir(join(goExtractedFolder, 'go'), 'go', goVersion);
      addPath(cachedPath);
    } else {
      info(`https://golang.google.cn/dl/go${goVersion}.linux-${archD}.tar.gz`);

      const goPath = await downloadTool(
        `https://golang.google.cn/dl/go${goVersion}.linux-${archD}.tar.gz`
      );
      const goExtractedFolder = await extractTar(goPath, './cache/go');

      const cachedPath = await cacheDir(join(goExtractedFolder, 'go'), 'go', goVersion);
      addPath(cachedPath);
    }
  } catch (error) {
    setFailed(JSON.stringify(error));
  }
}
