import { downloadTool, extractZip, extractTar, cacheDir, find } from '@actions/tool-cache';
import { addPath, info } from '@actions/core';
import { arch, platform as Platform } from 'os';
import { join } from 'path';
import { renameSync } from 'fs';

export type SupportedPlatform = 'win32' | 'darwin' | 'linux';

/**
 * 获取当前平台，不支持时返回 null（并打印 info）
 */
export function getSupportedPlatform(): SupportedPlatform | null {
  const platform = Platform();
  if (platform !== 'win32' && platform !== 'darwin' && platform !== 'linux') {
    info('不支持的操作系统');
    return null;
  }
  return platform;
}

/**
 * 把 unknown 错误格式化为可读字符串（Error 会被 JSON.stringify 序列化成 {}，需特殊处理）
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.stack || err.message;
  }
  return String(err);
}

export interface DownloadExtractCacheOptions {
  /** 下载地址 */
  url: string;
  /** 工具名（node / go / dotnet），用于 tool-cache 目录 */
  toolName: string;
  /** 具体版本号（semver） */
  version: string;
  /** 压缩包类型 */
  archiveType: 'zip' | 'tar.gz';
  /**
   * 解压后需要被 cacheDir 的源码目录在解压根目录下的相对路径。
   * 例如 node 解压后是 `node-v18.20.4-win-x64/`，go 是 `go/`，dotnet 就是根目录（用 '.'）。
   */
  cacheSourceSubdir?: string;
  /** 解压目标目录（相对 RUNNER_TEMP 或 cwd），默认 ./cache/<toolName> */
  extractDest?: string;
}

/**
 * 下载 → 解压 → 写入 tool-cache → addPath，返回缓存路径。
 * 内部不抛异常；失败时抛给调用方处理（调用方负责 setFailed）。
 */
export async function downloadExtractCache(opts: DownloadExtractCacheOptions): Promise<string> {
  const { url, toolName, version, archiveType, cacheSourceSubdir = '.', extractDest } = opts;

  info(url);
  const downloadPath = await downloadTool(url);
  const dest = extractDest ?? join('./cache', toolName);

  // Windows 上 @actions/tool-cache 在没有 pwsh（PowerShell Core）的环境会退回
  // Windows PowerShell 5.1 的 Expand-Archive，它强制要求 .zip 扩展名，否则报
  // NotSupportedArchiveFileExtension。所以 zip 包必须先改名加 .zip。
  // （nix 的 unzip / pwsh 的 ExtractToDirectory 不检查扩展名，不受影响）
  let archiveFile = downloadPath;
  if (archiveType === 'zip') {
    archiveFile = downloadPath + '.zip';
    renameSync(downloadPath, archiveFile);
  }

  const extractedFolder =
    archiveType === 'zip' ? await extractZip(archiveFile, dest) : await extractTar(downloadPath, dest);

  const sourceDir =
    cacheSourceSubdir === '.' ? extractedFolder : join(extractedFolder, cacheSourceSubdir);

  const cachedPath = await cacheDir(sourceDir, toolName, version, arch());
  addPath(cachedPath);
  return cachedPath;
}

/** 查找已缓存的工具；arch 不传时默认当前架构 */
export function findCached(toolName: string, version: string): string {
  return find(toolName, version, arch());
}
