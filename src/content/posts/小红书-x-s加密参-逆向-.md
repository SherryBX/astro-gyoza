---
title: 小红书 X-S加密参 逆向
date: 2025-06-11
lastMod: 2025-06-11
summary: 小红书 X-S加密参 逆向
category: 技术
tags:
  - 逆向
comments: true
draft: false
---

## 前言

心血来潮查看了下小红书的搜索接口，多测测试发现目前小红书(2025-06-11)接口只需要X-S了，我们只要逆向这一个

![image-20250611091528263](D:\Typora\IMG\image-20250611091528263.png)

## 请求

![image-20250611091646491](D:\Typora\IMG\image-20250611091646491.png)

直接搜索一手，看到hearders没跑了，跟过去下断点

![image-20250611091730068](D:\Typora\IMG\image-20250611091730068.png)

可以看到X-s是由v提取的，v是由f(p,u)生成的

![image-20250611093649278](D:\Typora\IMG\image-20250611093649278.png)

p为api接口

![image-20250611093549655](D:\Typora\IMG\image-20250611093549655.png)

u为对象

![image-20250611092717931](D:\Typora\IMG\image-20250611092717931.png)

f又是从上方得来的

我们确认一下是哪个函数

![image-20250611092753384](D:\Typora\IMG\image-20250611092753384.png)

长度判断很明显是第二个

![image-20250611092844200](D:\Typora\IMG\image-20250611092844200.png)

一个jsvmp文件，我们整体扣过来

![image-20250611093052588](D:\Typora\IMG\image-20250611093052588.png)

我们挂上代理开始补环境
