---
title: cloudflare 配置无限邮箱
date: 2025-06-12
lastMod: 2025-06-12
summary: cloudflare 配置无限邮箱
category: 技术
tags:
  - 技术
comments: true
draft: false
---

## 🍔准备工作

- 域名
- cloudflare

## 🍕实施过程

首先在阿里云购买域名

![](/images/uploads/cloudflare-配置无限邮箱-202506121131912.png)

进入转移域

![](/images/uploads/cloudflare-配置无限邮箱-202506121131120.png)

创建新域

![](/images/uploads/cloudflare-配置无限邮箱-202506121131891.png)

选择免费计划

![](/images/uploads/cloudflare-配置无限邮箱-202506121131309.png)

记住两个DNS，之后我们进入阿里云修改一下

![](/images/uploads/cloudflare-配置无限邮箱-202506121131323.png)

点击管理

![](/images/uploads/cloudflare-配置无限邮箱-202506121131198.png)

进行修改

![](/images/uploads/cloudflare-配置无限邮箱-202506121131523.png)

活动即托管完成

![](/images/uploads/cloudflare-配置无限邮箱-202506121131540.png)

进入电子邮件路由

![](/images/uploads/cloudflare-配置无限邮箱-202506121131561.png)

按照需求配置

![](/images/uploads/cloudflare-配置无限邮箱-202506121131577.png)

继续配置DNS解析，点击添加记录并启用
![](/images/uploads/cloudflare-配置无限邮箱-202506121131612.png)

配置规则

![](/images/uploads/cloudflare-配置无限邮箱-202506121131660.png)

![](/images/uploads/cloudflare-配置无限邮箱-202506121131785.png)

阿里云配置dns解析

![](/images/uploads/cloudflare-配置无限邮箱-202506121131633.png)

都开都开

![](/images/uploads/cloudflare-配置无限邮箱-202506121131135.png)

## 🍬测试流程

发送邮件

![](/images/uploads/cloudflare-配置无限邮箱-202506121131609.png)

成功接收到

![](/images/uploads/cloudflare-配置无限邮箱-202506121131081.png)

接下来可以白嫖cursor啦🥰
