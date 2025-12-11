import * as core from '@actions/core';
import osm from 'os';
import { rmSync } from 'fs';
import { dotnetInstall, goInstall, nodeInstall } from '../src/lib';
import { join } from 'path';
// 超时时间
jest.setTimeout(200000);
describe('gitea-tool-cache', () => {
  let inputs = {} as any;
  let os = {} as any;
  let inSpy: jest.SpyInstance;
  let platSpy: jest.SpyInstance;
  let archSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeAll(() => {
    process.env['RUNNER_TOOL_CACHE'] = join(process.cwd(), './cache/toolcache');
    process.env['RUNNER_TEMP'] = join(process.cwd(), './cache/temp');
  });

  beforeEach(() => {
    process.env['RUNNER_TOOL_CACHE'] = join(process.cwd(), './cache/toolcache');
    process.env['RUNNER_TEMP'] = join(process.cwd(), './cache/temp');
    // @actions/core
    inputs = {};
    inSpy = jest.spyOn(core, 'getInput');
    inSpy.mockImplementation(name => inputs[name]);

    os = {};
    platSpy = jest.spyOn(osm, 'platform');
    platSpy.mockImplementation(() => os['platform']);
    archSpy = jest.spyOn(osm, 'arch');
    archSpy.mockImplementation(() => os['arch']);

    // writes
    logSpy = jest.spyOn(core, 'info');
  });

  afterEach(() => {
    //jest.resetAllMocks();
    jest.clearAllMocks();
    //jest.restoreAllMocks();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  }, 200000);

  // 测试时需要把别的注释掉
  it('installs windows', async () => {
    // rmSync('./cache', { recursive: true, force: true });
    os['platform'] = 'win32';
    os['arch'] = 'x64';
    // node
    inputs['node-version'] = '18';
    nodeInstall();
    // go
    inputs['go-version'] = '1.21.1';
    goInstall();
    // dotnet
    inputs['dotnet-version'] = '6.0.100';
    dotnetInstall();
  });

  // it('installs linux', async () => {
  //   rmSync('./cache', { recursive: true, force: true });
  //   os['platform'] = 'linux';
  //   os['arch'] = 'x64';
  //   inputs['node-version'] = '18';
  //   inputs['go-version'] = '1.21.1';
  //   inputs['dotnet-version'] = '5.0.401';
  //   nodeInstall();
  //   goInstall();
  //   dotnetInstall();
  // });

  // it('installs darwin x64', async () => {
  //   rmSync('./cache', { recursive: true, force: true });
  //   os['platform'] = 'darwin';
  //   os['arch'] = 'x64';
  //   inputs['node-version'] = '18.18.0';
  //   inputs['go-version'] = '1.21.1';
  //   inputs['dotnet-version'] = '5.0.401';
  //    goInstall();
  //    nodeInstall();
  //   dotnetInstall();
  // });

  // it('installs darwin arm64', async () => {
  //   rmSync('./cache', { recursive: true, force: true });
  //   os['platform'] = 'darwin';
  //   os['arch'] = 'arm64';
  //   inputs['node-version'] = '18.18.0';
  //   inputs['go-version'] = '1.21.1';
  //   inputs['dotnet-version'] = '6.0.422';
  //   // nodeInstall();
  //   // goInstall();
  //   dotnetInstall();
  // });
});
