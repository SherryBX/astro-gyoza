---
title: IDA Pro 9 安装和插件配置
date: 2025-04-15
lastMod: 2025-04-15
summary: IDA Pro 9 安装和插件配置
category: 技术
tags:
  - 逆向
  - IDA Pro
comments: true
draft: false
---

## 🍔环境准备

- [IDA Pro 9](https://pan.baidu.com/s/16Hk9FjEygb1yohUzblxdFw?pwd=8put)
- win10/11
- python3.11

## 🍟项目实施

在项目准备部分下载**IDA Pro 9**

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151561.png)

首次运行先初始化一下

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151557.png)

选择y，IDA就配置好了

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151537.png)

这里推荐将快捷键改为旧版的快捷键

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151951.png)

**取消勾选**实用新快捷键

## 🌭IDA配置MCP

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151950.png)

进入IDA文件夹下python311文件夹

添加git代理（有需要的话）

```bash
git config --global --get http.proxy

git config --global http.proxy http://127.0.0.1:7890 && git config --global https.proxy http://127.0.0.1:7890
```

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151963.png)

进行mcp服务器安装

```bash
python -m pip install --upgrade git+https://github.com/mrexodia/ida-pro-mcp
```

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151787.png)

之后进入IDAPython的Scripts目录运行ida-pro-mcp.exe(若IDAPython不为系统python则需要手动进入该目录运行)

```bash
"D:\CTFtool\IDA Professional 9.1\python311\python.exe"  "D:\CTFtool\IDA Professional 9.1\python311\Scripts\ida-pro-mcp.exe" --install
```

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151287.png)

成功生成配置文件后,到IDA中运行MCP-Server

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151569.png)

记得要重启IDA

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151960.png)

cline链接

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151005.png)

测试使用

![](/images/uploads/ida-pro-9-安装和插件配置-202504151151330.png)

还挺快的

## 🍕总结

有了MCP后做逆向啥的方便多了 ，等同于给AI加了一双手，方便快捷
