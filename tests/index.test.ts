import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { platform, arch } from 'os';
import * as core from '@actions/core';
import { join } from 'path';
import { dotnetInstall, goInstall, nodeInstall } from '../src/lib';
import { rmSync, existsSync } from 'fs';

vi.mock(import('@actions/core'), async mo => ({
  ...(await mo()),
  getInput: vi.fn(),
  addPath: vi.fn(),
  setOutput: vi.fn()
}));

vi.mock(import('os'), async mo => {
  const actual = await mo();
  // 默认透传真实平台/架构，需要模拟其他平台时在用例里再 override
  return {
    ...actual,
    platform: vi.fn(() => actual.platform()),
    arch: vi.fn(() => actual.arch())
  };
});

vi.setConfig({
  testTimeout: 200000
});

// 真实下载的集成测试，默认跳过；INTEGRATION=1 时启用
//
// 用 PLATFORM 环境变量分开测试各平台（一次只跑一个，互不干扰）：
//   INTEGRATION=1                      只测当前系统平台
//   INTEGRATION=1 PLATFORM=win32       只测 win32（zip + Expand-Archive 分支）
//   INTEGRATION=1 PLATFORM=linux       只测 linux（tar.gz + tar 分支）
//   INTEGRATION=1 PLATFORM=darwin      只测 darwin（tar.gz 分支）
//   INTEGRATION=1 PLATFORM=all         依次测全部平台
const ALL_PLATFORMS = ['win32', 'linux', 'darwin'] as const;
const requestedPlatform = (process.env.PLATFORM ?? 'current').toLowerCase();
if (
  process.env.INTEGRATION &&
  requestedPlatform !== 'current' &&
  requestedPlatform !== 'all' &&
  !ALL_PLATFORMS.includes(requestedPlatform as (typeof ALL_PLATFORMS)[number])
) {
  throw new Error(`PLATFORM 无效: "${process.env.PLATFORM}"，可选 win32/linux/darwin/all`);
}
// 模块加载时 os mock 尚未被用例 override，platform()/arch() 透传真实值
const REAL_OS = { platform: platform(), arch: arch() };
const platformsToTest = ALL_PLATFORMS.filter(
  p =>
    requestedPlatform === 'all' ||
    (requestedPlatform === 'current' ? p === REAL_OS.platform : p === requestedPlatform)
);

describe.skipIf(!process.env.INTEGRATION)('integration (真实下载)', () => {
  let inputs: { [key: string]: string } = {};
  let os: { platform: NodeJS.Platform; arch: NodeJS.Architecture } = { ...REAL_OS };

  beforeAll(() => {
    process.env['RUNNER_TOOL_CACHE'] = join(process.cwd(), './cache/toolcache');
    process.env['RUNNER_TEMP'] = join(process.cwd(), './cache/temp');
  });
  beforeEach(() => {
    vi.mocked(core.getInput).mockImplementation(name => inputs[name]);
    vi.mocked(platform).mockImplementation(() => os['platform']);
    vi.mocked(arch).mockImplementation(() => os['arch']);
  });
  afterEach(() => {
    vi.clearAllMocks();
    os = { platform: platform(), arch: arch() };
    inputs = {};
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  // 按 PLATFORM 环境变量生成对应平台的用例，一次只测一个平台
  it.each(platformsToTest)('installs node on %s', async plat => {
    rmSync(join(process.cwd(), './cache'), { recursive: true, force: true });
    os['platform'] = plat;
    inputs['node-version'] = '18';
    await nodeInstall();
    expect(existsSync(join(process.cwd(), './cache/toolcache'))).toBe(true);
  }, 200000);

  it.each(platformsToTest)('installs go on %s', async plat => {
    rmSync(join(process.cwd(), './cache'), { recursive: true, force: true });
    os['platform'] = plat;
    inputs['go-version'] = '1.21.1';
    await goInstall();
    expect(existsSync(join(process.cwd(), './cache/toolcache'))).toBe(true);
  }, 200000);

  it.each(platformsToTest)('installs dotnet on %s', async plat => {
    rmSync(join(process.cwd(), './cache'), { recursive: true, force: true });
    os['platform'] = plat;
    inputs['dotnet-version'] = '6.0.100';
    await dotnetInstall();
    expect(existsSync(join(process.cwd(), './cache/toolcache'))).toBe(true);
  }, 200000);
});
