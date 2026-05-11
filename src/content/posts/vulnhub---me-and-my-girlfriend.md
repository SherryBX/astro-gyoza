---
title: vulnhub - Me and My Girlfriend
date: 2025-10-09
lastMod: 2025-10-09
summary: vulnhub - Me and My Girlfriend
category: 技术
tags:
  - CTF
comments: true
draft: false
---

---

tags:

- 渗透
- web
- vulnhub
  Date: 2025-10-09

---

## 环境配置

- [靶机](https://www.vulnhub.com/entry/me-and-my-girlfriend-1,409/)
- vmware 17
- kali
- win 10

网络使用 net 转换
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459433.png)

## 渗透测试

通过网络配置判断为同一网段（192.168.56.0/24）
通过 nmap 工具对同网段存活机器进行扫描

```bash
nmap -sS 192.168.56.0/24
```

![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459867.png)
可以看到目标靶机 ip，以及开启的对应端口，这里为 `22` 和 `80` 端口
访问 80 端口可以看到给出的信息
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459865.png)
Who are you? Hacker? Sorry This Site Can Only Be Accessed local!
提示说：只允许本地访问
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459131.png)
通过设置 `X-Forwarded-For:localhost` 进行尝试绕过
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459456.png)
成功进行绕过进入新页面
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459427.png)
通过 yakit 进行目录爆破发现 `robot.txt`
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459313.png)
我们可以看到出现新的文件
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459234.png)
给了我们新的提示
Great! What you need now is reconn, attack and got the shell
提示说：让我们获取新的 shell
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459500.png)
重新返回主页进入注册页进行注册账号
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459539.png)
注册后自动跳转至登录页，我们尝试使用刚刚注册的账号进行登录
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459438.png)
进入新页面仪表盘
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459519.png)
我们查看身份信息，可以看到用户的个人信息，并且 user_id 好像存在遍历，我们尝试爆破
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459123.png)
可以看到一些的响应长度不同
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459475.png)
通过查找我们可以成功找到 `alice` 的信息账号和密码，尝试通过 ssh 链接
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459740.png)
链接成功，并发现一个名为我的秘密的隐藏文件夹
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091500214.png)
文件夹中存在两份笔记，其中一份为 flag，另一份为 `alice` 的秘密
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459866.png)

> gfriEND{2f5f21b2af1b8c3e227bcf35544f8f09}

flag 的文本中提示我们获取 root 权限，去获取最终的 flag
通过 `id` 命令查看当前权限
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091459259.png)
通过 `sudo -l` 可以看到无需 root 执行的命令
alice 用户可以以 root 权限执行 PHP，且不需要密码。
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091500296.png)
进行提权

```bash
sudo php -r "system('/bin/bash');"
```

- 当你运行 sudo php 时，PHP 进程是以 root 权限运行的

- PHP 内部调用的任何系统命令也会以 root 权限运行

- /bin/bash 是一个系统命令，当以 root 权限启动时，你就获得了 root shell

成功进行提权
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091500458.png)
在 root 文件夹下成功获取第二个 flag
![](/images/uploads/vulnhub---me-and-my-girlfriend-202510091500368.png)

> gfriEND{56fbeef560930e77ff984b644fde66e7}

完结撒花🎉

## 总结

通过本次 `vulnhub` 的靶机之旅，收获到了：

- sudo -l 查看无需根权限使用的命令，从而通过其进行提权
- nmap 的扫描机制
- X-Forwarded-For: localhost 的本地化绕过
- 账号身份 id 遍历爆破
