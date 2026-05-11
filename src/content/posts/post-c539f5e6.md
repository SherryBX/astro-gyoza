---
title: Blender+MCP 配合Cursor实现自动建模
date: 2025-04-28
lastMod: 2025-04-28
summary: Blender+MCP 配合Cursor实现自动建模
category: 技术
tags:
  - 技术
comments: true
draft: false
---

## 环境准备

- [Blender](https://www.blender.org/download/)

- [Cursor](https://www.cursor.com/cn)
- [blender-mcp](https://github.com/ahujasid/blender-mcp)
- [Miniconda](https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda/)

## 项目实施

首先将blender下载安装好

![image-20250428092814358](D:\Typora\IMG\image-20250428092814358.png)

大概是这样的，选择简体中文

![image-20250428092853333](D:\Typora\IMG\image-20250428092853333.png)

之后进入blender-mcp项目，git下来

```bash
git clone https://github.com/ahujasid/blender-mcp.git
```

![image-20250428093004831](D:\Typora\IMG\image-20250428093004831.png)

这里我选在放在blender文件夹下，方便查找

![image-20250428093050272](D:\Typora\IMG\image-20250428093050272.png)

之后进入插件页

![image-20250428093153344](D:\Typora\IMG\image-20250428093153344.png)

选择从磁盘中安装

![image-20250428093209643](D:\Typora\IMG\image-20250428093209643.png)

找到刚刚clone下来的插件，选中其中的**addon.py**

![image-20250428093258793](D:\Typora\IMG\image-20250428093258793.png)

可以看到已经安装完毕

![image-20250428093318147](D:\Typora\IMG\image-20250428093318147.png)

勾选启动后，侧边栏存在一个链接mcp服务器

![image-20250428093529113](D:\Typora\IMG\image-20250428093529113.png)

之后进行python3.12的安装（这里默认安装好了miniconda或者anaconda）

```bash
conda create -n mcp python=3.12
```

![image-20250428094408268](D:\Typora\IMG\image-20250428094408268.png)

之后激活刚刚创建的mcp的python环境

```bash
conda activate mcp
```

![image-20250428094556013](D:\Typora\IMG\image-20250428094556013.png)

左边出现mcp则激活成功，安装uv包管理器，并设置环境变量

```bash
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

```bash
set Path=C:\Users\<user>\.local\bin;%Path%
```

![image-20250428101700348](D:\Typora\IMG\image-20250428101700348.png)

在mcp项目下使用uvx安装插件

```bash
uvx blender-mcp
```

![image-20250428102349934](D:\Typora\IMG\image-20250428102349934.png)

cursor链接

![image-20250428111829714](D:\Typora\IMG\image-20250428111829714.png)
