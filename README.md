# gitea-tool-cache

## 注意

1、go 和 dotnet 需要指定具体版本号

2、因为我没有 mac,所以没有 mac 环境

3、如果你想让 go 和 dotnet 支持版本号别名,欢迎 [pr](https://github.com/kongxiangyiren/version-alias)

## Usage

See [action.yml](action.yml)

<!-- start usage -->

```yaml
- id: tool-cache
 uses: kongxiangyiren/gitea-tool-cache@v2
  with:
    # go 和 dotnet 需要指定具体版本号
    node-version: 18
    go-version: 1.21.1
    dotnet-version: 6.0.100
```

<!-- end usage -->

**Basic:**

```yaml
jobs:
  linux:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        # go 和 dotnet 需要指定具体版本号
        node: [18]
        go: ['1.21.1']
        dotnet: ['6.0.100']

    steps:
      - name: Checkout
        uses: https://gitea.cn/actions/checkout@v4
      - id: tool-cache
        uses: kongxiangyiren/gitea-tool-cache@v2
        with:
          # go 和 dotnet 需要指定具体版本号
          node-version: ${{ matrix.node }}
          go-version: ${{ matrix.go }}
          dotnet-version: ${{ matrix.dotnet }}
      - uses: https://gitea.cn/actions/setup-node@v4
        with:
          # gitea-tool-cache导出 node 具体版本
          node-version: ${{ steps.tool-cache.outputs.node-version }}
      - run: node -v
      - uses: https://gitea.cn/actions/setup-go@v2
        with:
          go-version: ${{ matrix.go }}
      - run: go version
      - name: Setup .NET Core
        uses: https://gitea.cn/actions/setup-dotnet@v1
        env:
          # dotnet 安装位置
          DOTNET_INSTALL_DIR: ${{ steps.tool-cache.outputs.dotnet-path }}
        with:
          dotnet-version: ${{ matrix.dotnet }}
      - run: dotnet --version
```

## 只要安装 node

```yaml
jobs:
  linux:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        # 只有node支持版本号别名
        node: ['18']

    steps:
      - name: Checkout
        uses: https://gitea.cn/actions/checkout@v4
      - id: tool-cache
        uses: kongxiangyiren/gitea-tool-cache@v2
        with:
          # 只有node支持版本号别名
          node-version: ${{ matrix.node }}
      - uses: https://gitea.cn/actions/setup-node@v4
        with:
          # gitea-tool-cache导出 node 具体版本
          node-version: ${{ steps.tool-cache.outputs.node-version }}
      - run: node -v
```

## 只要安装 go

```yaml
jobs:
  linux:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        # 使用gitea-tool-cache需要指定具体的版本号
        go: ['1.21.1']

    steps:
      - name: Checkout
        uses: https://gitea.cn/actions/checkout@v4
      - name: 安装环境
        uses: kongxiangyiren/gitea-tool-cache@v2
        with:
          # 需要指定具体版本号
          go-version: ${{ matrix.go }}
      - uses: https://gitea.cn/actions/setup-go@v2
        with:
          go-version: ${{ matrix.go }}
      - run: go version
```

## 只要安装 dotnet

```yaml
jobs:
  linux:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        # 使用gitea-tool-cache需要指定具体的版本号
        dotnet: ['6.0.100']

    steps:
      - name: Checkout
        uses: https://gitea.cn/actions/checkout@v4
      - id: tool-cache
        uses: kongxiangyiren/gitea-tool-cache@v2
        with:
          # 需要指定具体版本号
          dotnet-version: ${{ matrix.dotnet }}
      - name: Setup .NET Core
        uses: https://gitea.cn/actions/setup-dotnet@v1
        env:
          # dotnet 安装位置
          DOTNET_INSTALL_DIR: ${{ steps.tool-cache.outputs.dotnet-path }}
        with:
          dotnet-version: ${{ matrix.dotnet }}
      - run: dotnet --version
```
