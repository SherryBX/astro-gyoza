---
title: 搭建 BlueLotus_XSSReceiver(蓝莲花) 个人xss平台
date: 2025-04-05
lastMod: 2025-04-05
summary: 搭建 BlueLotus_XSSReceiver(蓝莲花) 个人xss平台
category: 技术
tags:
  - 部署
  - Docker
comments: true
draft: false
---

## 🍔环境准备

- 服务器
- PHP7
- Apache

- [BlueLotus_XSSReceiver](https://github.com/firesunCN/BlueLotus_XSSReceiver)

## 🍕项目实施

进入`/var/www/html`对项目进行克隆

```bash
sudo git clone https://github.com/firesunCN/BlueLotus_XSSReceiver.git
```

![](</images/uploads/搭建-bluelotus_xssreceiver(蓝莲花)-个人xss平台-202504060034124.png>)

给权限（后面蓝莲花安装要写入啥啥的，干脆都给了）

```bash
chmod 777 *
```

![](</images/uploads/搭建-bluelotus_xssreceiver(蓝莲花)-个人xss平台-202504060034434.png>)

创建配置文件

```bash
cp config-sample.php config.php
sudo chmod 644 config.php
```

![](</images/uploads/搭建-bluelotus_xssreceiver(蓝莲花)-个人xss平台-202504060034096.png>)

重启apache

```bash
sudo systemctl restart apache2
```

访问http://ip/BlueLotus_XSSReceiver/admin.php

![](</images/uploads/搭建-bluelotus_xssreceiver(蓝莲花)-个人xss平台-202504060034159.png>)

## 🍟注意事项

- 还是好用php7，防止有的不兼容（别问，问就是我一开始用的8）
- 检查apache端口有没有占用
- 查看安全组是否开启对应端口
- 需要的权限是否开启

## 🌭吐槽

书接上文，最近不是搞了一个渗透机吗，就想着练练手，学学web。紧接着打开buu进行刷web题，刷到一个xss的题目，看wp有用到xss平台，想着这不刚白嫖一个ec2服务器吗，在这也不能荒废掉，就自己搭一个，刚开始搭这个蓝莲花，不知道哪里配置错了死活安装不上，后面就找有没有其他的xss平台，刷github刷到一个Medusa红客工具库，看着功能挺全想着搭这个。结果他们那个安装文档真的一坨啊，死活装不上，docker也不行，搞了我一个下午到晚上。最后想着换回蓝莲花，没想到这次一下又装上了，真的无语了。后面改他的title，发现突然访问不到了，以为是哪里配置有问题，结果才想起来，这是亚太地区的服务器，挂上梯子果然好了。
