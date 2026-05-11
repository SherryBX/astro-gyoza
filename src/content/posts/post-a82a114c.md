---
title: 多浏览器之间同步书签
date: 2025-10-29
lastMod: 2025-10-29
summary: 多浏览器之间同步书签
category: 技术
tags:
  - 技术
comments: true
draft: false
---

## 🍔环境配置

- Chrome
- Edge

- Floccus
- 坚果云

## 🍕项目实施

首先在两边浏览器同时装上扩展`Floccus`

![](/images/uploads/a82a114c-202510291229665.png)

点击添加配置

![](/images/uploads/a82a114c-202510291229661.png)

我们选择WebDAV共享

![](/images/uploads/a82a114c-202510291229794.png)

我们准备一个坚果云账号

开启WebDAV

![](/images/uploads/a82a114c-202510291229203.png)

创建个人同步文件夹

![](/images/uploads/a82a114c-202510291229867.png)

新建`bookmarks.xbel`文件

文件内容为：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xbel PUBLIC "+//IDN python.org//DTD XML Bookmark Exchange Language 1.0//EN//XML" "http://pyxml.sourceforge.net/topics/dtds/xbel.dtd">
<xbel version="1.0">
<!--- highestId :495: for Floccus bookmark sync browser extension -->

</xbel>
```

上传到刚刚创建的个人同步文件夹

![](/images/uploads/a82a114c-202510291229915.png)

回到Floccus，配置刚才坚果云给的信息

![](/images/uploads/a82a114c-202510291229959.png)

![](/images/uploads/a82a114c-202510291229188.png)

![](/images/uploads/a82a114c-202510291229213.png)

之后点击扩展的同步按钮

![](/images/uploads/a82a114c-202510291229450.png)

回到坚果云可以看到文件大小有变化了

![](/images/uploads/a82a114c-202510291229762.png)

将扩展配置导出

![](/images/uploads/a82a114c-202510291229834.png)

在edge中导入扩展配置

![](/images/uploads/a82a114c-202510291229870.png)

别忘记修改对应的文件夹映射

![](/images/uploads/a82a114c-202510291229480.png)

关闭安全保护

![](/images/uploads/a82a114c-202510291229518.png)

之后再次点击同步即可

![](/images/uploads/a82a114c-202510291229146.png)
