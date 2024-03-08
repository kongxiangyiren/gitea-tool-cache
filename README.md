# gitea-tool-cache

## 注意

1、需要指定具体版本号

2、因为我没有 mac,所以没有 mac 环境

## Usage

See [action.yml](action.yml)

<!-- start usage -->

```yaml
- uses: kongxiangyiren/gitea-tool-cache@v1
  with:
    # 需要指定具体版本号
    node-version: 18.18.0
    go-version: 1.21.1
```

<!-- end usage -->

**Basic:**

```yaml
jobs:
  linux:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        # 使用gitea-tool-cache需要指定具体的版本号
        node: ['18.18.0']
        go: ['1.21.1']
        dotnet: ['6.0.100']

    steps:
      - name: Checkout
        uses: https://gitea.cn/actions/checkout@v4
      - id: tool-cache
        uses: kongxiangyiren/gitea-tool-cache@v1
        with:
          # 需要指定具体版本号
          node-version: ${{ matrix.node }}
          go-version: ${{ matrix.go }}
          dotnet-version: ${{ matrix.dotnet }}
      - uses: https://gitea.cn/actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
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
        # 使用gitea-tool-cache需要指定具体的版本号
        node: ['18.18.0']

    steps:
      - name: Checkout
        uses: https://gitea.cn/actions/checkout@v4
      - name: 安装环境
        uses: kongxiangyiren/gitea-tool-cache@v1
        with:
          # 需要指定具体版本号
          node-version: ${{ matrix.node }}
      - uses: https://gitea.cn/actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
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
        uses: kongxiangyiren/gitea-tool-cache@v1
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
        uses: kongxiangyiren/gitea-tool-cache@v1
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
