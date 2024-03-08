import { join } from 'path';
import { downloadTool, extractZip, extractTar, extractXar, cacheDir } from '@actions/tool-cache';
import { addPath, getInput, setOutput } from '@actions/core';
import { arch, platform as Platform } from 'os';
import { existsSync, renameSync } from 'fs';
import { get } from 'axios';

// 安装dotnet
export async function dotnetInstall() {
  const platform = Platform();
  const dotnetVersion = getInput('dotnet-version');
  if (!dotnetVersion) {
    console.log('没有dotnet-version,跳过dotnet安装');
    return;
  }

  if (
    process.env['RUNNER_TOOL_CACHE'] &&
    existsSync(join(process.env['RUNNER_TOOL_CACHE'], 'dotnet', dotnetVersion, arch()))
  ) {
    console.log('dotnet已经安装过了');
    return setOutput(
      'dotnet-path',
      join(process.env['RUNNER_TOOL_CACHE'], 'dotnet', dotnetVersion, arch())
    );
  }
  const versionList = dotnetVersion.split('.');
  const channelVersion = `${versionList[0]}.${versionList[1]}`;
  const releasesUrl = `https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/${channelVersion}/releases.json`;
  const releases = await get(releasesUrl).catch(err => {
    console.log(err);
    return null;
  });

  if (!releases || !releases.data) {
    console.log('获取dotnet版本失败');
    return false;
  }
  const releasesList = (releases.data as Record<string, any>).releases;
  const release = releasesList.find(
    (item: Record<string, any>) => item.sdk.version === dotnetVersion
  );
  if (!release) {
    console.log('没有找到dotnet版本');
    return false;
  }

  const list = release.sdk.files.find((item: Record<string, any>) => {
    if (platform === 'win32') {
      return item.rid === 'win-' + arch() && item.url.endsWith('.zip');
    } else if (platform === 'darwin') {
      return item.rid === 'osx-' + arch() && item.url.endsWith('.pkg');
    } else {
      return item.rid === 'linux-' + arch() && item.url.endsWith('.tar.gz');
    }
  });
  if (!list) {
    console.log('没有找到dotnet版本');
    return false;
  }
  //   console.log(list);

  console.log(list.url);

  const dotnetPath = await downloadTool(list.url);
  if (platform === 'win32') {
    renameSync(dotnetPath, dotnetPath + '.zip');
    const dotnetExtractedFolder = await extractZip(dotnetPath + '.zip', './cache/dotnet');
    const cachedPath = await cacheDir(dotnetExtractedFolder, 'dotnet', dotnetVersion);
    addPath(cachedPath);
    setOutput('dotnet-path', cachedPath);
  } else if (platform === 'darwin') {
    console.log('没有mac,暂未测试');
  } else {
    const dotnetExtractedFolder = await extractTar(dotnetPath, './cache/dotnet');
    const cachedPath = await cacheDir(dotnetExtractedFolder, 'dotnet', dotnetVersion);
    addPath(cachedPath);
    setOutput('dotnet-path', cachedPath);
  }
}
