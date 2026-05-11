---
title: 京东 h5st 参数逆向
date: 2025-06-24
lastMod: 2025-06-24
summary: 京东 h5st 参数逆向
category: 技术
tags:
  - 逆向
  - 加密分析
comments: true
draft: false
---

## 🍔环境准备

- chrome
- python3.8
- pycharm

## 🍟项目实施

> 正常的 h5st 长度为 1050 - 1200

通过搜索定位到 h5st 参数位置

![image-20250624093147625](D:\Typora\IMG\image-20250624093147625.png)

可以看到是先对h进行加密得到 g.body

之后有对 g 加密得到 b，b中存在h5st

![image-20250624093324313](D:\Typora\IMG\image-20250624093324313.png)

断点断住 我们拿到此时 h 和 g 的值

![image-20250624093459294](D:\Typora\IMG\image-20250624093459294.png)

g 值参数如下，e为时间戳

![image-20250624094805298](D:\Typora\IMG\image-20250624094805298.png)

标准 sha256 加密

![image-20250624111852678](D:\Typora\IMG\image-20250624111852678.png)

找到 window.PSign 实例化位置

![image-20250624111919715](D:\Typora\IMG\image-20250624111919715.png)

直接扣过来

![image-20250624112437893](D:\Typora\IMG\image-20250624112437893.png)

跟进 sign 方法，这里已经生成了 h5st

![image-20250624112904401](D:\Typora\IMG\image-20250624112904401.png)

这里可以看到 调用的是原型链中的 \_$sdnmd 方法

整体逻辑清晰了，我们就差 ParamsSign 这个类

![image-20250624113604545](D:\Typora\IMG\image-20250624113604545.png)

搜索观察到整个类为一个文件,全部拿下来

![image-20250624130510590](D:\Typora\IMG\image-20250624130510590.png)

导入运行发现报错，我们挂代理开始补环境

我们设置

```js
window = globalThis
```

如果是 23.10 以下版本 node 需要删除global

反之则不需要

这里我们采用 nvm 来一件管理 node 版本

```bash
nvm list available
nvm install 23.10.0
```

![image-20250624132315371](D:\Typora\IMG\image-20250624132315371.png)

切换版本

```bash
nvm list
nvm use 23.10.0
node -v
```

![image-20250624132303257](D:\Typora\IMG\image-20250624132303257.png)

**切记做原型链的时候对象应该是原型链大写**

```js
// 原型链赋值
function Window() {}
Object.setPrototypeOf(window, Window.prototype)
```
