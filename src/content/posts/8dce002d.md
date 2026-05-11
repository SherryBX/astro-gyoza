---
title: 记一次 淘宝评论sign 值逆向
date: 2025-06-04
lastMod: 2025-06-04
summary: 记一次 淘宝评论sign 值逆向
category: 技术
tags:
  - 逆向
  - 加密分析
comments: true
draft: false
---

## 🍔开篇

也是很久没有做js逆向了孩子们，接到一个单子要爬淘宝评论，本来想用自动化秒了的，死活定位不到哈哈哈，搞了一晚上受不了了，选择使用协议过掉。

![](/images/uploads/8dce002d-202506041112009.png)

## 🌮环境准备

- python 3.8
- vscode
- chrome

## 🍕项目实施

DevTools抓包定位到评论接口

![](/images/uploads/8dce002d-202506041112036.png)

说实话淘宝的评论接口还是仁慈啊，不像那个够吧搜索接口

![](/images/uploads/8dce002d-202506041112032.png)

请求没啥加密参数

![](/images/uploads/8dce002d-202506041113809.png)

载荷里面有个sign，一个时间戳，还有一个密钥。data代表多少页（**尝试了一下更改每页最大请求数，发现报非法参数**）

所以总的来说就一个sign

本来想用XHR断点，nnd才发现不是XHR。又考虑直接搜索sign，发现还是太多了

![](/images/uploads/8dce002d-202506041113399.png)

我们直接启动器追栈

![](/images/uploads/8dce002d-202506041113349.png)

进来后搜sign发现好多了，我们给可疑地方上断点，如图这里（多次调试）

![](/images/uploads/8dce002d-202506041113459.png)

触发断点，这个sign很明显了，32位其实感觉像md5了，不确定，应该先试试的（写稿子才想起来没测试）

![](/images/uploads/8dce002d-202506041113406.png)

不管啦 继续逆向

![](/images/uploads/8dce002d-202506041113159.png)

能看到sign其实是eP，eP又是由这四个参数组成

- 多次请求发现token为固定值

- eI是时间戳
- 多次请求发现eS为固定12574478
- data就是我们的请求页数

所以我们追到eE看怎么构成

![](/images/uploads/8dce002d-202506041113508.png)

步入看到一堆赋值，感觉有用先保存下来

![](/images/uploads/8dce002d-202506041113942.png)

eE则是一大堆函数嵌套

我们直接全扣，也是大功告成了

![](/images/uploads/8dce002d-202506041113846.png)

整体则是这样

![](/images/uploads/8dce002d-202506041113781.png)

sign逆向结束

## 🍬观后感

看到32位猜测是md5，拿了cmd5爆破了一下没有爆破出来，nnd应该再试试组成参数的，省着我自己扣
