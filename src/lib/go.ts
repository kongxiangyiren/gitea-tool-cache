import { getInput, info, setFailed, addPath } from '@actions/core';
import { arch } from 'os';
import {
  getSupportedPlatform,
  downloadExtractCache,
  findCached,
  formatError,
  type SupportedPlatform
} from './common';

// go 发布包：win 用 zip，其他 tar.gz；架构名 x64→amd64
const GO_DIST: Record<SupportedPlatform, { archiveType: 'zip' | 'tar.gz'; osName: string }> = {
  win32: { archiveType: 'zip', osName: 'windows' },
  darwin: { archiveType: 'tar.gz', osName: 'darwin' },
  linux: { archiveType: 'tar.gz', osName: 'linux' }
};

function goArch(): string {
  return arch() === 'x64' ? 'amd64' : arch();
}

// 安装golang
export async function goInstall() {
  const platform = getSupportedPlatform();
  if (!platform) {
    return;
  }

  const goVersion = getInput('go-version');
  if (!goVersion) {
    info('没有go-version,跳过go安装');
    return;
  }

  // 命中缓存：直接 addPath
  const cached = findCached('go', goVersion);
  if (cached) {
    info('go已经安装过了');
    addPath(cached);
    return;
  }

  try {
    const { archiveType, osName } = GO_DIST[platform];
    const url = `https://golang.google.cn/dl/go${goVersion}.${osName}-${goArch()}.${archiveType}`;

    await downloadExtractCache({
      url,
      toolName: 'go',
      version: goVersion,
      archiveType,
      // go 解压后内部是 go/ 目录
      cacheSourceSubdir: 'go'
    });
  } catch (error) {
    setFailed(formatError(error));
  }
}
