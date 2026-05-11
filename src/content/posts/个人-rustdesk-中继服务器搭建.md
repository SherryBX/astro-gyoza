---
title: 个人 RustDesk 中继服务器搭建
date: 2025-03-30
lastMod: 2025-03-30
summary: 个人 RustDesk 中继服务器搭建
category: 技术
tags:
  - 部署
comments: true
draft: false
---

## 引言

​ 程协助软件对于鼠标来说，是必不可少的，需要每天远程处理各种电脑问题。之前用的软件，默默挥舞起镰刀，开始收费了！也罢，白用了好几年了，是时候功成身退了。毕竟一年的费用，上手一台云服务器，还是绰绰有余的。有了服务器，使用RustDesk搭建自己的中继服务器，打造自己专属的远程协助工具，没有各种限制，画质好、速度快，何乐不为呢？

## 准备工作

- 一台云服务器
- [RustDesk安装包](https://github.com/rustdesk/rustdesk/releases/tag/1.3.80)

- finalshell（远程链接工具）

## 技术实现

首先我们在github中下载rustdesk安装包

![](/images/uploads/个人-rustdesk-中继服务器搭建-202503301343467.png)

根据自己的配置进行选择对应的安装包

![](/images/uploads/个人-rustdesk-中继服务器搭建-202503301343325.png)

在自己服务器面板的安全组中设置rustdesk需要的端口（博主这里采用**阿里云**的服务器）

```bash
TCP:21115-21119
UDP:21116
```

![](/images/uploads/个人-rustdesk-中继服务器搭建-202503301343004.png)

在1panel中安装RustDesk应用容器

![](/images/uploads/个人-rustdesk-中继服务器搭建-202503301343601.png)

记得勾选端口外部访问

![](/images/uploads/个人-rustdesk-中继服务器搭建-202503301343577.png)

安装完成后配置中继服务器地址

- ID服务器： 云服务公网IP:21116

- 中继服务器： 云服务公网IP:21117

- key：key

![](/images/uploads/个人-rustdesk-中继服务器搭建-202503301343755.png)

进入RustDesk目录（/opt/1panel/apps/rustdesk/RustDesk/data/hbbs）

找到id.pub，打开之后复制出key

![](/images/uploads/个人-rustdesk-中继服务器搭建-202503301343157.png)

最后在你的RustDesk中配置一下即可

![](/images/uploads/个人-rustdesk-中继服务器搭建-202503301343063.png)

> 别忘记在手机中配置中继服务器
