---
title: 微信 强开Dev Tool
date: 2025-04-03
lastMod: 2025-04-03
summary: 微信 强开Dev Tool
category: 技术
tags:
  - 逆向
  - 移动安全
  - 微信
comments: true
draft: false
---

## 🍔环境准备

- [ WeChatOpenDevTool项目](https://github.com/JaveleyQAQ/WeChatOpenDevTools-Python)

- [Miniconda](https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda/)
- [微信](https://github.com/tom-snow/wechat-windows-versions/releases)

## 🍕项目实践

首先根据项目支持的wx版本和小程序版本进行下载

Windows：

![](/images/uploads/b246ff95-202504032143178.png)

Mac：

![](/images/uploads/b246ff95-202504032143184.png)

---

访问Miniconda清华源下载站，按需下载

![](/images/uploads/b246ff95-202504032143154.png)

下载完后进行安装

![](/images/uploads/b246ff95-202504032143006.png)

这里推荐环境统一放在一个路径，方便以后管理

![](/images/uploads/b246ff95-202504032143663.png)

这里别忘记添加环境变量，最新版miniconda好像没有自动添加环境变量的了。

```bash
C:\Environment\Miniconda
C:\Environment\Miniconda\Scripts
```

![](/images/uploads/b246ff95-202504032143036.png)

命令行使用`conda`命令查看是否应用成功 (记得重启终端)

![](/images/uploads/b246ff95-202504032143745.png)

这里对项目进行clone (连不上github的可以科学上网或者使用国内镜像源)

```bash
git clone https://github.com/JaveleyQAQ/WeChatOpenDevTools-Python.git
```

![](/images/uploads/b246ff95-202504032143777.png)

在管理员状态下打开cmd，使用miniconda创建新环境

```bash
conda create -n py3.12 python=3.12
```

![](/images/uploads/b246ff95-202504032143433.png)

进行激活环境

```bash
conda activate py3.12
```

![](/images/uploads/b246ff95-202504032143622.png)

当左边出现环境名称就成功了，接下来安装对应requirements

```bash
pip install -r requirements.txt
```

![](/images/uploads/b246ff95-202504032143245.png)

之后进行微信的安装，在[项目](https://github.com/tom-snow/wechat-windows-versions/releases)中下载支持的微信版本，博主这里采用3.9.10.19版本

![](/images/uploads/b246ff95-202504032143003.png)

这里写了个bat脚本方便一件启动和激活环境，将其填入文本文件，后缀改成bat即可

```bat
@echo off
REM 启动新 cmd 窗口，并执行命令链
start "" "%windir%\System32\cmd.exe" /k "cd /d C:\Environment\WeChatOpenDevTools-Python && call activate py3.12 && python main.py -all"
```

![](/images/uploads/b246ff95-202504032143071.png)

成功注入小程序

![](/images/uploads/b246ff95-202504032143773.png)

这里拿瑞幸咖啡做示例，成功打开dev tool。(**千万别点上方的更改语言！！！**)

![](/images/uploads/b246ff95-202504032143511.png)

## 🌭常见问题

> Q：为什么同样的版本注入不成功？
>
> A：可能是小程序版本不同，到C:\Users\ <用户名> \AppData\Roaming\Tencent\WeChat\XPlugin\Plugins\RadiumWMPF 路径下，将原先的小程序版本删除，之后重新登录微信生成新小程序版本

> Q：为什么我的miniconda指定不了路径，一直报错？
>
> A：路径需要遵守miniconda规范

## 🍟吐槽

今天换了一个渗透虚拟机，结果在装虚拟机的时候，这个虚拟机太大了，把我的盘都充爆了(╬▔皿▔)╯。只能删删减减，将之前用的逆向机也删了。所以我就没小程序逆向机用了，只能在这边再装一个。复习重温一遍还是有收获的，顺利多了ヾ(≧▽≦\*)o
