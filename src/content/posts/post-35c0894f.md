---
title: 猿人学App逆向 第二题
date: 2025-07-12
lastMod: 2025-07-12
summary: 猿人学App逆向 第二题
category: 技术
tags:
  - 逆向
  - 移动安全
  - 加密分析
comments: true
draft: false
---

## 🍔环境准备

- 小米 8
- frida 16
- pycharm
- jadx
- reqable

## 🍕项目实施

书接上回，继续对猿人学第二题进行解答

![image-20250712161822960](D:\Typora\IMG\image-20250712161822960.png)

抓包确认接口

![image-20250712161846166](D:\Typora\IMG\image-20250712161846166.png)

jadx 搜索定位接口位置

![image-20250712161908532](D:\Typora\IMG\image-20250712161908532.png)

![image-20250712161914403](D:\Typora\IMG\image-20250712161914403.png)

查看调用实例跟过去

![image-20250712161935140](D:\Typora\IMG\image-20250712161935140.png)

sign 值生成逻辑在后面，继续跟过去

![image-20250712162019031](D:\Typora\IMG\image-20250712162019031.png)

so 层的加密，不过我们还是可以通过java层hook 看一下传的是什么参数

```js
Java.perform(function () {
  let ChallengeTwoFragment = Java.use(
    'com.yuanrenxue.match2022.fragment.challenge.ChallengeTwoFragment',
  )
  ChallengeTwoFragment['sign'].implementation = function (str) {
    console.log(`start [Method] ChallengeTwoFragment.sign is called: str=${str}`)
    let result = this['sign'](str)
    console.log(`end   [Method] ChallengeTwoFragment.sign result=${result}`)
    return result
  }
})
```

![image-20250712162100237](D:\Typora\IMG\image-20250712162100237.png)

参数构成为

```bash
page:time
```

## 🍟编写脚本

## 🌭总结
