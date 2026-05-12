import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postsDir = path.join(__dirname, 'src/content/posts');
const uploadsDir = path.join(__dirname, 'public/images/uploads');

// 下载图片函数
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        const stats = fs.statSync(filepath);
        if (stats.size === 0) {
          reject(new Error(`Downloaded file is empty: ${filepath}`));
        } else {
          console.log(`✓ Downloaded ${path.basename(filepath)} (${stats.size} bytes)`);
          resolve();
        }
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });

    request.on('error', (err) => {
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

// 处理单篇文章的图片
async function processArticleImages(articlePath) {
  const content = fs.readFileSync(articlePath, 'utf-8');
  const filename = path.basename(articlePath, '.md');

  console.log(`\n处理文章: ${filename}`);

  // 匹配图片引用
  const imageRegex = /!\[.*?\]\((\/images\/uploads\/[^)]+)\)/g;
  const matches = [...content.matchAll(imageRegex)];

  if (matches.length === 0) {
    console.log('  没有图片');
    return;
  }

  console.log(`  找到 ${matches.length} 张图片`);

  for (const match of matches) {
    const localPath = match[1]; // /images/uploads/xxx.png
    const imageName = path.basename(localPath);
    const fullPath = path.join(uploadsDir, imageName);

    // 检查文件是否存在且大小为0
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.size > 0) {
        console.log(`  ✓ ${imageName} 已存在 (${stats.size} bytes)`);
        continue;
      }
    }

    // 从文件名提取原始图片ID
    // 格式: {hash}-{timestamp}.{ext}
    const parts = imageName.split('-');
    if (parts.length < 2) {
      console.log(`  ✗ 无法解析图片名: ${imageName}`);
      continue;
    }

    const timestamp = parts[1].replace(/\.(png|jpg|jpeg|gif|webp)$/, '');

    // 构建原始Gitee URL (通过weserv代理)
    const giteeUrl = `https://gitee.com/SherryBX/img/raw/master/${timestamp}.${imageName.split('.').pop()}`;
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(giteeUrl)}`;

    console.log(`  下载: ${timestamp}.${imageName.split('.').pop()}`);

    try {
      await downloadImage(proxyUrl, fullPath);
    } catch (error) {
      console.log(`  ✗ 下载失败: ${error.message}`);
      // 尝试直接从Gitee下载
      try {
        console.log(`  尝试直接从Gitee下载...`);
        await downloadImage(giteeUrl, fullPath);
      } catch (error2) {
        console.log(`  ✗ 直接下载也失败: ${error2.message}`);
      }
    }

    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// 主函数
async function main() {
  console.log('开始修复图片...\n');

  // 获取所有文章
  const articles = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(postsDir, file));

  console.log(`找到 ${articles.length} 篇文章\n`);

  // 处理每篇文章
  for (const article of articles) {
    await processArticleImages(article);
  }

  console.log('\n完成!');

  // 统计结果
  const images = fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.'));
  const validImages = images.filter(img => {
    const stats = fs.statSync(path.join(uploadsDir, img));
    return stats.size > 0;
  });

  console.log(`\n统计:`);
  console.log(`  总图片数: ${images.length}`);
  console.log(`  有效图片: ${validImages.length}`);
  console.log(`  失败图片: ${images.length - validImages.length}`);
}

main().catch(console.error);
