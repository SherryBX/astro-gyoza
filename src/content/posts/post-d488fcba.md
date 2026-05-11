---
title: 跨设备跨浏览器共享cookie
date: 2025-10-29
lastMod: 2025-10-29
summary: 跨设备跨浏览器共享cookie
category: 技术
tags:
  - 技术
comments: true
draft: false
---

## 🍔环境配置

- Chrome
- Edge
- sync your cookie
- cloudflare

## 🍕项目实施

上篇文章写了如何共享书签，但是书签拿到了还要一个个登录账号就很烦了，我们这篇文章讲讲如何跨设备跨浏览器共享cookie

![](/images/uploads/d488fcba-202510291342902.png)

进入扩展配置页面

![](/images/uploads/d488fcba-202510291342897.png)

这里使用`cloudflare`的kv存储

![](/images/uploads/d488fcba-202510291342901.png)

复制你的账号id

![](/images/uploads/d488fcba-202510291342192.png)

创建kv存储

创建完成后复制你的空间id

![](/images/uploads/d488fcba-202510291342828.png)

之后创建一个api密钥

![](/images/uploads/d488fcba-202510291342667.png)

读取编辑权限给上

![](/images/uploads/d488fcba-202510291342910.png)

保存好你的api密钥

![](/images/uploads/d488fcba-202510291342433.png)

三个信息相应填写

![](/images/uploads/d488fcba-202510291342273.png)

在Edge中同样下载扩展同样配置

![](/images/uploads/d488fcba-202510291342542.png)

这里拿b站测试一下成功上传和拉取

![](/images/uploads/d488fcba-202510291342382.png)

侧边栏管理端也可以看到信息
