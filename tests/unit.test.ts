import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { platform, arch } from 'os';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { join } from 'path';

// mock 所有外部副作用
vi.mock(import('@actions/core'), async mo => ({
  ...(await mo()),
  getInput: vi.fn(),
  addPath: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  info: vi.fn()
}));

vi.mock(import('@actions/tool-cache'), async mo => ({
  ...(await mo()),
  find: vi.fn(),
  findAllVersions: vi.fn(),
  evaluateVersions: vi.fn(),
  downloadTool: vi.fn(),
  extractZip: vi.fn(),
  extractTar: vi.fn(),
  cacheDir: vi.fn()
}));

vi.mock(import('os'), async mo => ({
  ...(await mo()),
  platform: vi.fn(),
  arch: vi.fn()
}));

// renameSync 是真实 fs 调用（给下载文件加 .zip 扩展名），单测里 mock 掉避免 ENOENT
vi.mock(import('fs'), async mo => ({
  ...(await mo()),
  renameSync: vi.fn()
}));

vi.mock(import('node-version-alias'), async mo => ({
  ...(await mo()),
  default: vi.fn()
}));

import { nodeInstall, goInstall, dotnetInstall, formatError } from '../src/lib';
import nodeVersionAlias from 'node-version-alias';

describe('unit: gitea-tool-cache', () => {
  let inputs: Record<string, string> = {};

  beforeEach(() => {
    vi.mocked(core.getInput).mockImplementation(name => inputs[name] ?? '');
    vi.mocked(platform).mockReturnValue('linux');
    vi.mocked(arch).mockReturnValue('x64');
    vi.mocked(tc.find).mockReturnValue('');
    vi.mocked(tc.findAllVersions).mockReturnValue([]);
    vi.mocked(tc.evaluateVersions).mockReturnValue('');
    vi.mocked(tc.downloadTool).mockResolvedValue('/tmp/pkg');
    vi.mocked(tc.extractZip).mockResolvedValue('/tmp/extracted');
    vi.mocked(tc.extractTar).mockResolvedValue('/tmp/extracted');
    vi.mocked(tc.cacheDir).mockResolvedValue('/cache/tool/1.0.0');
  });

  afterEach(() => {
    vi.clearAllMocks();
    inputs = {};
  });

  describe('formatError', () => {
    it('Error 返回 stack 或 message', () => {
      const e = new Error('boom');
      expect(formatError(e)).toContain('boom');
    });
    it('非 Error 转字符串', () => {
      expect(formatError('oops')).toBe('oops');
      expect(formatError(42)).toBe('42');
    });
  });

  describe('node', () => {
    it('无 node-version 时跳过', async () => {
      await nodeInstall();
      expect(core.setFailed).not.toHaveBeenCalled();
      expect(tc.downloadTool).not.toHaveBeenCalled();
    });

    it('不支持的平台直接返回', async () => {
      vi.mocked(platform).mockReturnValue('aix');
      inputs['node-version'] = '18';
      await nodeInstall();
      expect(core.info).toHaveBeenCalledWith('不支持的操作系统');
      expect(tc.downloadTool).not.toHaveBeenCalled();
    });

    it('别名解析失败时 setFailed', async () => {
      inputs['node-version'] = '18';
      vi.mocked(nodeVersionAlias).mockRejectedValue(new Error('bad version'));
      await nodeInstall();
      expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('node版本错误'));
      expect(tc.downloadTool).not.toHaveBeenCalled();
    });

    it('缓存命中时输出具体版本', async () => {
      inputs['node-version'] = '18';
      vi.mocked(nodeVersionAlias).mockResolvedValue('18.20.4');
      vi.mocked(tc.find).mockReturnValue('/cache/node/18.20.4');
      await nodeInstall();
      expect(core.setOutput).toHaveBeenCalledWith('node-version', '18.20.4');
      expect(tc.downloadTool).not.toHaveBeenCalled();
    });

    it('断网且缓存有匹配版本时，用本地缓存版本', async () => {
      inputs['node-version'] = '18';
      // 别名解析失败（断网）
      vi.mocked(nodeVersionAlias).mockRejectedValue(new Error('network down'));
      // 本地缓存有 18.20.4 / 20.11.0
      vi.mocked(tc.findAllVersions).mockReturnValue(['18.20.4', '20.11.0']);
      vi.mocked(tc.evaluateVersions).mockReturnValue('18.20.4');
      vi.mocked(tc.find).mockReturnValue('/cache/node/18.20.4');
      await nodeInstall();
      expect(tc.evaluateVersions).toHaveBeenCalledWith(['18.20.4', '20.11.0'], '18');
      expect(core.setOutput).toHaveBeenCalledWith('node-version', '18.20.4');
      expect(core.setFailed).not.toHaveBeenCalled();
      expect(tc.downloadTool).not.toHaveBeenCalled();
    });

    it('断网且缓存无匹配版本时 setFailed', async () => {
      inputs['node-version'] = '18';
      vi.mocked(nodeVersionAlias).mockRejectedValue(new Error('network down'));
      vi.mocked(tc.findAllVersions).mockReturnValue(['20.11.0']);
      vi.mocked(tc.evaluateVersions).mockReturnValue(''); // 无匹配
      await nodeInstall();
      expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('node版本错误'));
      expect(tc.downloadTool).not.toHaveBeenCalled();
    });

    it('linux 构造正确 tar.gz URL 并下载', async () => {
      inputs['node-version'] = '18';
      vi.mocked(nodeVersionAlias).mockResolvedValue('18.20.4');
      await nodeInstall();
      expect(tc.downloadTool).toHaveBeenCalledWith(
        'https://registry.npmmirror.com/-/binary/node/v18.20.4/node-v18.20.4-linux-x64.tar.gz'
      );
      expect(tc.extractTar).toHaveBeenCalled();
      expect(core.setOutput).toHaveBeenCalledWith('node-version', '18.20.4');
    });

    it('win32 构造 zip URL', async () => {
      vi.mocked(platform).mockReturnValue('win32');
      inputs['node-version'] = '18';
      vi.mocked(nodeVersionAlias).mockResolvedValue('18.20.4');
      await nodeInstall();
      expect(tc.downloadTool).toHaveBeenCalledWith(
        expect.stringContaining('node-v18.20.4-win-x64.zip')
      );
      // zip 包会被 renameSync 加上 .zip 扩展名（Windows PowerShell 5.1 Expand-Archive 要求）
      expect(tc.extractZip).toHaveBeenCalledWith('/tmp/pkg.zip', join('./cache', 'node'));
      expect(tc.extractTar).not.toHaveBeenCalled();
    });
  });

  describe('go', () => {
    it('无 go-version 时跳过', async () => {
      await goInstall();
      expect(tc.downloadTool).not.toHaveBeenCalled();
    });

    it('x64 映射为 amd64，linux 构造正确 URL', async () => {
      inputs['go-version'] = '1.21.1';
      await goInstall();
      expect(tc.downloadTool).toHaveBeenCalledWith(
        'https://golang.google.cn/dl/go1.21.1.linux-amd64.tar.gz'
      );
    });

    it('win32 用 windows 命名与 zip', async () => {
      vi.mocked(platform).mockReturnValue('win32');
      inputs['go-version'] = '1.21.1';
      await goInstall();
      expect(tc.downloadTool).toHaveBeenCalledWith(
        'https://golang.google.cn/dl/go1.21.1.windows-amd64.zip'
      );
    });

    it('缓存命中时 addPath', async () => {
      inputs['go-version'] = '1.21.1';
      vi.mocked(tc.find).mockReturnValue('/cache/go/1.21.1');
      await goInstall();
      expect(core.addPath).toHaveBeenCalledWith('/cache/go/1.21.1');
      expect(tc.downloadTool).not.toHaveBeenCalled();
    });
  });

  describe('dotnet', () => {
    const releasesJson = {
      releases: [
        {
          sdk: {
            version: '6.0.100',
            files: [
              { rid: 'linux-x64', url: 'https://example.com/dotnet-sdk-6.0.100-linux-x64.tar.gz' },
              { rid: 'win-x64', url: 'https://example.com/dotnet-sdk-6.0.100-win-x64.zip' }
            ]
          }
        }
      ]
    };

    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(releasesJson)
        })
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('无 dotnet-version 时跳过', async () => {
      await dotnetInstall();
      expect(tc.downloadTool).not.toHaveBeenCalled();
    });

    it('缓存命中时 addPath + setOutput', async () => {
      inputs['dotnet-version'] = '6.0.100';
      vi.mocked(tc.find).mockReturnValue('/cache/dotnet/6.0.100');
      await dotnetInstall();
      expect(core.addPath).toHaveBeenCalledWith('/cache/dotnet/6.0.100');
      expect(core.setOutput).toHaveBeenCalledWith('dotnet-path', '/cache/dotnet/6.0.100');
      expect(tc.downloadTool).not.toHaveBeenCalled();
    });

    it('linux 匹配 linux-x64 tar.gz 并输出路径', async () => {
      inputs['dotnet-version'] = '6.0.100';
      await dotnetInstall();
      expect(tc.downloadTool).toHaveBeenCalledWith(
        'https://example.com/dotnet-sdk-6.0.100-linux-x64.tar.gz'
      );
      expect(tc.extractTar).toHaveBeenCalled();
      expect(core.setOutput).toHaveBeenCalledWith('dotnet-path', '/cache/tool/1.0.0');
    });

    it('win32 匹配 win-x64 zip', async () => {
      vi.mocked(platform).mockReturnValue('win32');
      inputs['dotnet-version'] = '6.0.100';
      await dotnetInstall();
      expect(tc.downloadTool).toHaveBeenCalledWith(
        'https://example.com/dotnet-sdk-6.0.100-win-x64.zip'
      );
      expect(tc.extractZip).toHaveBeenCalled();
    });

    it('releases 请求失败时 setFailed', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as any);
      inputs['dotnet-version'] = '6.0.100';
      await dotnetInstall();
      expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('获取dotnet版本失败'));
    });

    it('找不到对应版本时 setFailed', async () => {
      inputs['dotnet-version'] = '9.9.9';
      await dotnetInstall();
      expect(core.setFailed).toHaveBeenCalledWith('没有找到dotnet版本');
    });
  });
});
