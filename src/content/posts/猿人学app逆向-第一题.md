---
title: 猿人学App逆向 第一题
date: 2025-07-10
lastMod: 2025-07-10
summary: 猿人学App逆向 第一题
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

- jadx
- frida 16
- r0captrue
- charles
- postern

## 🍕项目实施

一开始抓包 死活抓不到

之后使用 `r0captrue`可以成功抓到

![](/images/uploads/猿人学app逆向-第一题-202507102004810.png)

猜测vpn校验，代理校验，证书校验，无非就是这几个，试了一下，发现是证书校验

![](/images/uploads/猿人学app逆向-第一题-202507102004787.png)

使用`postern`代理一下

![](/images/uploads/猿人学app逆向-第一题-202507102004814.png)

可以看到成功过掉ssl证书校验

![](/images/uploads/猿人学app逆向-第一题-202507102004852.png)

成功抓包，参数如下

- sign
- token
- t

t 很明显是时间戳

![](/images/uploads/猿人学app逆向-第一题-202507102004113.png)

直接搜索接口找到post请求位置

![](/images/uploads/猿人学app逆向-第一题-202507102004490.png)

按 x 查找该函数调用

![](/images/uploads/猿人学app逆向-第一题-202507102004729.png)

跟过来，生成逻辑如下：

```java
return ((o0O0ooO.OooO0O0) this.mRequest.OooOOO0(o0O0ooO.OooO0O0.class)).OooO00o(Integer.valueOf(this.page), new Sign().sign(sb.toString().getBytes(StandardCharsets.UTF_8)), Long.valueOf(longValue));
```

![](/images/uploads/猿人学app逆向-第一题-202507102004083.png)

这个sign，我们hook一下

![](/images/uploads/猿人学app逆向-第一题-202507102004364.png)

成功hook出来参数

![](/images/uploads/猿人学app逆向-第一题-202507102004782.png)

![](/images/uploads/猿人学app逆向-第一题-202507102004095.png)

仔细观察发现参数构成为

```bash
page=页码时间戳
```

![](/images/uploads/猿人学app逆向-第一题-202507102004407.png)

转码也能看出来

## 🍟编写脚本

```python
import requests
import frida
import sys
import logging
import time
import colorlog
import json
import random

# 配置彩色日志
handler = colorlog.StreamHandler()
handler.setFormatter(colorlog.ColoredFormatter(
    '%(log_color)s%(asctime)s - %(levelname)s - %(message)s',
    log_colors={
        'DEBUG': 'cyan',
        'INFO': 'green',
        'WARNING': 'yellow',
        'ERROR': 'red',
        'CRITICAL': 'red,bg_white',
    }
))

logger = logging.getLogger()
logger.handlers = []
logger.addHandler(handler)
logger.setLevel(logging.INFO)

def on_message(message, data):
    if message['type'] == 'send':
        logger.info("[*] 收到消息: %s", message['payload'])
    else:
        logger.info("%s", message)

headers = {
    "Host": "appmatch.yuanrenxue.cn",
    "accept-language": "zh-CN,zh;q=0.8",
    "user-agent": "Mozilla/5.0 (Linux; U; Android 10; zh-cn; 25010PN30C Build/QKQ1.190828.002) AppleWebKit/533.1 (KHTML, like Gecko) Version/5.0 Mobile Safari/533.1",
    "content-type": "application/x-www-form-urlencoded",
    "cache-control": "no-cache"
}
url = "https://appmatch.yuanrenxue.cn/app1"

process = frida.get_usb_device(-1).attach('com.yuanrenxue.match2022')
logger.info("成功附加到进程")

# 加载脚本
with open('sign-rpc.js', 'r', encoding='utf-8') as f:
    jsCode = f.read()

script = process.create_script(jsCode)
script.on('message', on_message)
script.load()
logger.info("脚本加载成功")

# 创建RPC接口
rpc = script.exports

value = 0
max_retries = 3

for page in range(1, 101):
    retries = 0
    success = False

    while not success and retries < max_retries:
        try:
            # 每次请求使用新的时间戳
            t = str(int(time.time()))
            logger.info(f"当前时间戳: {t}")

            sign_str = f"page={page}{t}"
            logger.info(f"签名字符串: {sign_str}")

            # 调用RPC函数获取sign
            sign = rpc.getsign(sign_str)
            logger.info(f"获取到的sign: {sign}")

            # 构建请求数据
            data = {
                "page": page,
                "sign": sign,
                "t": t,
                "token": "mtZ6WDIas3B pJkcTcogsCWdvtwJcR8z95WDN6ctqVEH3Ef8W3UQlWnn3JKmfsGW"
            }

            # 发送请求
            response = requests.post(url, headers=headers, data=data)
            response_json = response.json()
            logger.info(f"响应: {json.dumps(response_json)}")

            if "error" in response_json:
                logger.error(f"请求错误: {response_json['error']}")
                retries += 1
                logger.warning(f"第 {page} 页请求失败，正在重试 ({retries}/{max_retries})...")
                time.sleep(2)  # 重试前等待2秒
                continue

            # 处理数据
            if "data" in response_json:
                for i in response_json['data']:
                    value += int(i['value'])
                success = True
                logger.info(f"第 {page} 页请求成功，当前总和: {value}")
            else:
                logger.error(f"响应中没有data字段: {response_json}")
                retries += 1
                logger.warning(f"第 {page} 页请求失败，正在重试 ({retries}/{max_retries})...")
                time.sleep(2)

        except Exception as e:
            logger.error(f"请求异常: {str(e)}")
            retries += 1
            logger.warning(f"第 {page} 页请求失败，正在重试 ({retries}/{max_retries})...")
            time.sleep(2)

    if not success:
        logger.critical(f"第 {page} 页请求失败，已达到最大重试次数，跳过该页")

    # 请求间隔，避免频率过高
    time.sleep(random.uniform(0.5, 1.5))

logger.info(f"最终结果: {value}")

```

![](/images/uploads/猿人学app逆向-第一题-202507102004645.png)

![](/images/uploads/猿人学app逆向-第一题-202507102004188.png)

## 🌭总结

总的来说整体难度不难，唯一可能难一点的就在抓包了，还有最最重要的是rpc函数千万不能大写！！！
