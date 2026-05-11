---
title: 知乎 x-zse-96 参数逆向
date: 2025-06-19
lastMod: 2025-06-19
summary: 知乎 x-zse-96 参数逆向
category: 技术
tags:
  - 逆向
  - 加密分析
comments: true
draft: false
---

## 🍔环境准备

- nodejs

- python3.8

- pycharm

## 🍕项目实施

首先抓包知乎搜索接口

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804051.png)

经过调试只需要`X-Zse-96`，`X-Zse93`，`X-Zst-81`，而`X-Zse93`和`X-Zst-81`和为固定参数，

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804025.png)

直接搜索参数可以看到第一个即是关键点

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804048.png)

向上跟一栈可以看到参数构成位置

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804378.png)

我们可以看到`x-zse-96`参数是由tk来的，而tk又是由tT.signature，tT构成由ed来的，我们跟进ed看看

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804608.png)

进来可以看到是通过

```js
;(0, tJ(ti).encrypt)(ty()(tp))
```

得到的加密参数

tp由上面几个参数拼接而来

ta是固定的

tu是传参进来的，我们跟回去

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804341.png)

可以看到由tO由er函数得来 我们跟进

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804716.png)

一个正则用于匹配cookie中d_c0的值

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804074.png)

提取代码成功打印出d_c0

之后咱们回到刚刚的加密出进入第一层加密

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804680.png)

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804693.png)

加密出来有点像md5，我们使用标准md5加密试试

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804065.png)

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804302.png)

可以看到确实是标准md5，这一层就过了

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804511.png)

进入第二层可以看到exports，

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804782.png)

最上方又有webpack，所以这是一个webpack打包的

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804191.png)

该模块为1514，我们下断点尝试找到加载器

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804361.png)

向上跟一栈我们可以找到加载器

我们将加载器和模块都复制下来

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804857.png)

创建全局xx，用于导出p，并且打印调用了哪些模块方便排查

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804959.png)

报错没有self，我们将self全部换成window去承接

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804230.png)

顺手补一个window，可以看到没报错，尝试调用加密函数

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804650.png)

别忘记D函数是导出给ZP了

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804023.png)

成功调用 接下来我们只需要保留1514和74185模块就行了

运行结果发现和浏览器的值不一样，猜测有检测，我们挂上代理补环境

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804488.png)

好多原型链检测，还有canvas

![](/images/uploads/知乎-x-zse-96-参数逆向-202506191804938.png)

补完环境后固定一下随机数即可发现加密参数一致了

## 🍟项目总结

js逆向这东西还是要多扣，熟练webpack调用方式，多尝试挂代理，使用固定参数确认是否一致，不一致的时候推测是否进了蜜罐，多观察try。
