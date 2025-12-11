import { downloadTool, extractZip, extractTar, cacheDir, find } from '@actions/tool-cache';
import { addPath, getInput, setOutput, info, setFailed, error } from '@actions/core';
import { arch, platform as Platform } from 'os';
import { renameSync } from 'fs';
import { default as axios } from 'axios';

// 安装dotnet
export async function dotnetInstall() {
  const platform = Platform();

  if (platform !== 'win32' && platform !== 'darwin' && platform !== 'linux') {
    info('不支持的操作系统');
    return;
  }

  const dotnetVersion = getInput('dotnet-version');
  if (!dotnetVersion) {
    info('没有dotnet-version,跳过dotnet安装');
    return;
  }

  const dotnetPath = find('dotnet', dotnetVersion, arch());

  if (dotnetPath) {
    info('dotnet已经安装过了');
    return setOutput('dotnet-path', dotnetPath);
  }
  const versionList = dotnetVersion.split('.');
  const channelVersion = `${versionList[0]}.${versionList[1]}`;
  const releasesUrl = `https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/${channelVersion}/releases.json`;
  const releases = await axios.get(releasesUrl).catch(err => {
    error(err);
    return null;
  });

  if (!releases || !releases.data) {
    return setFailed('获取dotnet版本失败');
  }
  const releasesList = (releases.data as Record<string, any>).releases;
  const release = releasesList.find(
    (item: Record<string, any>) => item.sdk.version === dotnetVersion
  );
  if (!release) {
    return setFailed('没有找到dotnet版本');
  }

  const list = release.sdk.files.find((item: Record<string, any>) => {
    if (platform === 'win32') {
      return item.rid === 'win-' + arch() && item.url.endsWith('.zip');
    } else if (platform === 'darwin') {
      return item.rid === 'osx-' + arch() && item.url.endsWith('.tar.gz');
    } else if (platform === 'linux') {
      return item.rid === 'linux-' + arch() && item.url.endsWith('.tar.gz');
    }
  });
  if (!list) {
    return setFailed('没有找到dotnet版本');
  }

  info(list.url);

  try {
    const dotnetPath = await downloadTool(list.url);
    if (platform === 'win32') {
      renameSync(dotnetPath, dotnetPath + '.zip');
      const dotnetExtractedFolder = await extractZip(dotnetPath + '.zip', './cache/dotnet');
      const cachedPath = await cacheDir(dotnetExtractedFolder, 'dotnet', dotnetVersion);
      addPath(cachedPath);
      setOutput('dotnet-path', cachedPath);
    } else if (platform === 'darwin') {
      const dotnetExtractedFolder = await extractTar(dotnetPath, './cache/dotnet');
      const cachedPath = await cacheDir(dotnetExtractedFolder, 'dotnet', dotnetVersion);
      addPath(cachedPath);
      setOutput('dotnet-path', cachedPath);
    } else if (platform === 'linux') {
      const dotnetExtractedFolder = await extractTar(dotnetPath, './cache/dotnet');
      const cachedPath = await cacheDir(dotnetExtractedFolder, 'dotnet', dotnetVersion);
      addPath(cachedPath);
      setOutput('dotnet-path', cachedPath);
    }
  } catch (error) {
    setFailed(JSON.stringify(error));
  }
}
