---
title: 创造与魔法 外挂卡密 破解
date: 2025-07-14
lastMod: 2025-07-14
summary: 创造与魔法 外挂卡密 破解
category: 技术
tags:
  - 逆向
  - 加密分析
comments: true
draft: false
---

## 🍔环境准备

- 小米 8
- rlgg
- reqable

## 🍕项目实施

书接上回，最近在精进安卓逆向，突发奇想找一些软件进行破解

好久没看葫芦侠了，尤记得在葫芦侠发帖那几年🥰

发现悬赏 破解卡密，卡密是个好东西啊，说搞就搞

![](/images/uploads/b1fa18ff-202507141745475.jpg)

下载出来可以看到是个 GG 脚本，云 lua脚本

![](/images/uploads/b1fa18ff-202507141745582.png)

我们抓包看看

![](/images/uploads/b1fa18ff-202507141745491.png)

请求和响应都有加密，我们直接进这个 ip 看看

![](/images/uploads/b1fa18ff-202507141745720.png)

一个云验证平台，但是我们知道的是他的lua存在云端，我们使用模块给他拖下来

![](/images/uploads/b1fa18ff-202507141745181.png)

再次运行刚刚的GG

![](/images/uploads/b1fa18ff-202507141745085.png)

云lua拖出来是这样的，找个网站进行反编译一下

![](/images/uploads/b1fa18ff-202507141745750.png)

变正常啦，观察前方校验处，我们尝试将接口换成我们自己的

去他官网注册一下账号

![](/images/uploads/b1fa18ff-202507141745489.png)

![](/images/uploads/b1fa18ff-202507141745195.png)

创建应用，顺手给自己开一张永久卡😎

![](/images/uploads/b1fa18ff-202507141745229.png)

下载云验证示例，将对应参数替换成我们自己的

![](/images/uploads/b1fa18ff-202507141745644.png)

输入我们自己的卡密，也是很成功的进入了

可以愉快奔放啦

## 🌭总结

第一次遇到这种 GG 脚本，本以为是apk，拖 jadx 分析半天，又是找接口又是字符串啥的，没头绪，了解了一下才知道是云 lua
