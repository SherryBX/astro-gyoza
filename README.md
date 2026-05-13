# Sherry's Blog

个人博客站点，基于 Astro 和 React 构建的现代化静态博客。

![astro version](https://img.shields.io/badge/astro-4.6-red)
![node version](https://img.shields.io/badge/node-18.18-green)
![deployment](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange)

**在线访问**: [sherry77.me](https://sherry77.me)

## ✨ 特性

- 🎵 **QQ 音乐播放器** - 同步 QQ 音乐歌单，全站音乐播放（1728 首歌）
- 📝 **Decap CMS** - 可视化内容管理，支持在线编辑文章
- 🔍 **全文搜索** - 基于 Pagefind 的静态搜索，无需后端
- 🌓 **深色模式** - 自动主题切换，支持多种配色方案
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ⚡ **极速加载** - Cloudflare CDN 全球加速
- 🎨 **流畅动画** - Framer Motion + Swup 页面切换
- 📊 **SEO 优化** - 规范的 URL、OpenGraph、站点地图、RSS 订阅
- 🔐 **安全部署** - GitHub Actions + Cloudflare Workers

## 🛠️ 技术栈

**前端框架**

- [Astro](https://astro.build/) - 静态站点生成器
- [React](https://reactjs.org/) - 交互组件
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架

**核心库**

- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Jotai](https://jotai.org/) - 状态管理
- [APlayer](https://aplayer.js.org/) - 音乐播放器
- [Pagefind](https://pagefind.app/) - 静态搜索

**后端服务**

- [Cloudflare Pages](https://pages.cloudflare.com/) - 静态托管
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless 函数
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - 边缘数据库

## 📁 项目结构

```text
Astro4Sherry/
├── .github/workflows/      # GitHub Actions CI/CD
├── oauth-worker/           # OAuth 认证 Worker
├── public/
│   ├── images/uploads/     # 上传的图片
│   ├── fonts/              # 字体文件
│   └── sherry/             # Decap CMS 配置
├── src/
│   ├── components/         # React/Astro 组件
│   │   ├── MusicPlayer.tsx # QQ 音乐播放器
│   │   ├── header/         # 顶部导航
│   │   ├── footer/         # 页脚
│   │   ├── post/           # 文章组件
│   │   └── ui/             # 通用 UI 组件
│   ├── content/            # Markdown 内容
│   │   ├── posts/          # 博客文章
│   │   ├── projects/       # 项目展示
│   │   ├── friends/        # 友链
│   │   └── spec/           # 特殊页面
│   ├── layouts/            # 页面布局
│   ├── pages/              # 路由页面
│   ├── plugins/            # Markdown 插件
│   ├── styles/             # 全局样式
│   ├── utils/              # 工具函数
│   └── config.json         # 站点配置
├── astro.config.js         # Astro 配置
├── tailwind.config.ts      # Tailwind 配置
└── package.json
```

## 🚀 快速开始

### 环境要求

- Node.js 18.18+
- pnpm 9+

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
pnpm dev
```

访问 [http://localhost:4321](http://localhost:4321)

### 构建

```bash
pnpm build
```

构建产物输出到 `dist/` 目录，包含 Pagefind 搜索索引。

### 预览

```bash
pnpm preview
```

## 📝 内容管理

### 命令行创建

```bash
# 创建新文章
pnpm new-post

# 创建新项目
pnpm new-project

# 添加友链
pnpm new-friend
```

### Decap CMS 可视化编辑

访问 [sherry77.me/sherry](https://sherry77.me/sherry) 使用可视化编辑器。

需要 GitHub OAuth 认证（通过 Cloudflare Worker 代理）。

## ⚙️ 配置

站点配置保存在 [src/config.json](src/config.json)：

- `site` - 站点基本信息（标题、描述、URL）
- `author` - 作者信息
- `hero` - 首页配置（简介、社交链接）
- `menus` - 导航菜单
- `color` - 主题配色
- `analytics` - 分析工具（Google Analytics、Umami、Microsoft Clarity）

## 🎵 音乐播放器

集成 QQ 音乐 API，支持：

- 同步 QQ 音乐歌单（当前 1728 首歌）
- 全站固定底部播放器
- 专辑封面显示
- 列表滚动浏览

API 部署在 Cloudflare Workers：`qq-music-api.sherry-account.workers.dev`

## 🚢 部署

### 自动部署

推送到 `main` 分支自动触发 GitHub Actions 部署到 Cloudflare Pages。

需要配置 GitHub Secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### 手动部署

```bash
pnpm build
wrangler pages deploy dist --project-name=astro4sherry
```

## 📄 许可证

MIT License

## 🙏 致谢

基于 [Gyoza](https://github.com/lxchapu/astro-gyoza) 模板构建。
