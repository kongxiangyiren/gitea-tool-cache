import { getInput, setOutput, setFailed, info } from '@actions/core';
import { arch } from 'os';
import { findAllVersions, evaluateVersions } from '@actions/tool-cache';
import nodeVersionAlias from 'node-version-alias';
import {
  getSupportedPlatform,
  downloadExtractCache,
  findCached,
  formatError,
  type SupportedPlatform
} from './common';

// 各平台 node 发布包的命名与压缩格式
const NODE_DIST: Record<
  SupportedPlatform,
  { archiveType: 'zip' | 'tar.gz'; fileName: (version: string, arch: string) => string }
> = {
  win32: {
    archiveType: 'zip',
    fileName: (v, a) => `node-v${v}-win-${a}`
  },
  darwin: {
    archiveType: 'tar.gz',
    fileName: (v, a) => `node-v${v}-darwin-${a}`
  },
  linux: {
    archiveType: 'tar.gz',
    fileName: (v, a) => `node-v${v}-linux-${a}`
  }
};

// 断网时从本地缓存解析别名：在已缓存的 node 版本里匹配符合 versionSpec 的具体版本
function resolveFromCache(versionSpec: string): string {
  const localVersions = findAllVersions('node', arch()) ?? [];
  if (localVersions.length === 0) {
    return '';
  }
  // evaluateVersions 返回匹配到的具体版本，无匹配时返回空字符串
  return evaluateVersions(localVersions, versionSpec) || '';
}

// 安装node
export async function nodeInstall() {
  const platform = getSupportedPlatform();
  if (!platform) {
    return;
  }

  const nodeVersion = getInput('node-version');
  if (!nodeVersion) {
    info('没有node-version,跳过node安装');
    return;
  }

  // 解析别名（如 18 → 18.20.4），需要联网
  let version = await nodeVersionAlias(nodeVersion, {
    mirror: 'https://npmmirror.com/mirrors/node',
    fetch: true
  }).catch(err => err);

  if (version instanceof Error) {
    // 断网兜底：别名解析失败时，尝试从本地缓存匹配出具体版本
    const cachedVersion = resolveFromCache(nodeVersion);
    if (!cachedVersion) {
      setFailed('node版本错误: ' + formatError(version));
      return;
    }
    info(`无法联网解析 node 版本别名，使用本地缓存匹配的版本 ${cachedVersion}`);
    version = cachedVersion;
  }

  // 命中缓存：直接 addPath 并输出具体版本，action 可独立使用
  const cached = findCached('node', version);
  if (cached) {
    info('node已经安装过了');
    setOutput('node-version', version);
    return;
  }

  try {
    const { archiveType, fileName } = NODE_DIST[platform];
    const fileBase = fileName(version, arch());
    const url = `https://registry.npmmirror.com/-/binary/node/v${version}/${fileBase}.${archiveType}`;

    await downloadExtractCache({
      url,
      toolName: 'node',
      version,
      archiveType,
      // node 解压后内部还有一层 node-vX.Y.Z-<plat>-<arch>/ 目录
      cacheSourceSubdir: fileBase
    });
    setOutput('node-version', version);
  } catch (error) {
    setFailed(formatError(error));
  }
}
