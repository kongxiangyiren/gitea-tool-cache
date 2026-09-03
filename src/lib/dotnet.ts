import { getInput, setOutput, info, setFailed, addPath } from '@actions/core';
import { arch } from 'os';
import {
  getSupportedPlatform,
  downloadExtractCache,
  findCached,
  formatError,
  type SupportedPlatform
} from './common';

// dotnet rid 与压缩格式映射
const DOTNET_RID: Record<SupportedPlatform, { rid: string; archiveType: 'zip' | 'tar.gz' }> = {
  win32: { rid: 'win', archiveType: 'zip' },
  darwin: { rid: 'osx', archiveType: 'tar.gz' },
  linux: { rid: 'linux', archiveType: 'tar.gz' }
};

interface DotnetReleaseFile {
  rid: string;
  url: string;
}
interface DotnetRelease {
  sdk: { version: string; files: DotnetReleaseFile[] };
}

// 安装dotnet
export async function dotnetInstall() {
  const platform = getSupportedPlatform();
  if (!platform) {
    return;
  }

  const dotnetVersion = getInput('dotnet-version');
  if (!dotnetVersion) {
    info('没有dotnet-version,跳过dotnet安装');
    return;
  }

  // 命中缓存：直接 addPath + 输出路径
  const cached = findCached('dotnet', dotnetVersion);
  if (cached) {
    info('dotnet已经安装过了');
    addPath(cached);
    setOutput('dotnet-path', cached);
    return;
  }

  // 查询 releases.json 拿下载地址
  const versionList = dotnetVersion.split('.');
  const channelVersion = `${versionList[0]}.${versionList[1]}`;
  const releasesUrl = `https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/${channelVersion}/releases.json`;

  let release: DotnetRelease | undefined;
  try {
    const res = await fetch(releasesUrl);
    if (!res.ok) {
      setFailed(`获取dotnet版本失败: HTTP ${res.status}`);
      return;
    }
    const data = (await res.json()) as { releases: DotnetRelease[] };
    release = data.releases.find(item => item.sdk.version === dotnetVersion);
  } catch (error) {
    setFailed('获取dotnet版本失败: ' + formatError(error));
    return;
  }

  if (!release) {
    setFailed('没有找到dotnet版本');
    return;
  }

  const { rid, archiveType } = DOTNET_RID[platform];
  const ext = `.${archiveType}`;
  const file = release.sdk.files.find(
    item => item.rid === `${rid}-${arch()}` && item.url.endsWith(ext)
  );
  if (!file) {
    setFailed('没有找到dotnet版本');
    return;
  }

  try {
    // dotnet 解压后根目录就是 SDK 内容
    const cachedPath = await downloadExtractCache({
      url: file.url,
      toolName: 'dotnet',
      version: dotnetVersion,
      archiveType,
      cacheSourceSubdir: '.'
    });
    setOutput('dotnet-path', cachedPath);
  } catch (error) {
    setFailed(formatError(error));
  }
}
