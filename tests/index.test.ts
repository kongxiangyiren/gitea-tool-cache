import { afterAll, afterEach, beforeAll, beforeEach, describe, it, vi } from 'vitest';
import { platform, arch } from 'os';
import * as core from '@actions/core';
import { join } from 'path';
import { dotnetInstall, goInstall, nodeInstall } from '../src/lib';
import { rmSync } from 'fs';

vi.mock(import('@actions/core'), async mo => ({
  ...(await mo()),
  getInput: vi.fn(),
  setOutput: (name, value) => {
    console.log(name, value);
  }
}));

vi.mock(import('os'), async mo => ({
  ...(await mo()),
  platform: vi.fn(),
  arch: vi.fn()
}));

vi.setConfig({
  testTimeout: 200000
});
describe('gitea-tool-cache', () => {
  let inputs: {
    [key: string]: string;
  } = {};

  let os: { platform: NodeJS.Platform; arch: NodeJS.Architecture } = {
    platform: platform(),
    arch: arch()
  };
  beforeAll(() => {
    process.env['RUNNER_TOOL_CACHE'] = join(process.cwd(), './cache/toolcache');
    process.env['RUNNER_TEMP'] = join(process.cwd(), './cache/temp');
  });
  beforeEach(() => {
    // 重置模拟实现
    vi.mocked(core.getInput).mockImplementation(name => inputs[name]);

    // 设置模拟实现

    vi.mocked(platform).mockImplementation(() => os['platform']);

    vi.mocked(arch).mockImplementation(() => os['arch']);
  });

  afterEach(() => {
    vi.clearAllMocks();
    os = {
      platform: platform(),
      arch: arch()
    };
    inputs = {};
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it('installs windows', async () => {
    rmSync(join(process.cwd(), './cache'), { recursive: true, force: true });
    os['platform'] = 'win32';
    os['arch'] = 'x64';
    // // node
    // inputs['node-version'] = '18';
    // await nodeInstall();
    // // go
    // inputs['go-version'] = '1.21.1';
    // await goInstall();
    // dotnet
    inputs['dotnet-version'] = '6.0.100';
    await dotnetInstall();
  }, 200000);

  // it('installs linux', async () => {
  //   rmSync(join(process.cwd(), './cache'), { recursive: true, force: true });
  //   os['platform'] = 'linux';
  //   os['arch'] = 'x64';
  //   // node
  //   // inputs['node-version'] = '18';
  //   // nodeInstall();
  //   // go
  //   // inputs['go-version'] = '1.21.1';
  //   // await goInstall();
  //   // dotnet
  //   // inputs['dotnet-version'] = '6.0.100';
  //   // await dotnetInstall();
  // }, 200000);

  // it('installs macos', async () => {
  //   rmSync(join(process.cwd(), './cache'), { recursive: true, force: true });
  //   os['platform'] = 'darwin';
  //   os['arch'] = 'x64';
  //   // node
  //   inputs['node-version'] = '18';
  //   await nodeInstall();
  //   // // go
  //   // inputs['go-version'] = '1.21.1';
  //   // await goInstall();
  // });

  // it('installs macos arm64', async () => {
  //   rmSync(join(process.cwd(), './cache'), { recursive: true, force: true });
  //   os['platform'] = 'darwin';
  //   os['arch'] = 'arm64';
  //   // node
  //   inputs['node-version'] = '18';
  //   await nodeInstall();
  //   // // go
  //   // inputs['go-version'] = '1.21.1';
  //   // await goInstall();
  // });
});
