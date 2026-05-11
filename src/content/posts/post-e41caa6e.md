---
title: 搭建 PeiQi-WIKI-Book (佩奇文库)
date: 2025-04-08
lastMod: 2025-04-08
summary: 搭建 PeiQi-WIKI-Book (佩奇文库)
category: 技术
tags:
  - 部署
  - Docker
comments: true
draft: false
---

## 🍔环境准备

- 服务器
- docker
- [PeiQi-WIKI-Book](https://github.com/PeiQi0/PeiQi-WIKI-Book)

## 🍟项目实施

准备好docker

![](/images/uploads/e41caa6e-202504081532896.png)

进行拉去镜像

```bash
docker pull peiqipeiqi/peiqi_wiki:220420
```

![](/images/uploads/e41caa6e-202504081532876.png)

运行容器

```bash
docker run -t -d -p 65534:80 --name "PeiQi_Wiki" peiqipeiqi/peiqi_wiki:220420
```

![](/images/uploads/e41caa6e-202504081532901.png)

在端口中开启端口

![](/images/uploads/e41caa6e-202504081532939.png)

默认网站登录密码为peiqi/peiqi

![](/images/uploads/e41caa6e-202504081532027.png)

## 🌭后话

docker真是好东西呀，部署太快了，最近不是正在学渗透嘛，所以就到处找一些视频来看，看到有用漏洞库刷分的技巧，正好看到别人推荐这个，就自己部署一个在服务器上，好像实时gitee更新。看起来挺不错的。
