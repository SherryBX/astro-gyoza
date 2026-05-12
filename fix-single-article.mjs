import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlePath = path.join(__dirname, 'src/content/posts/61aa2977.md');
const uploadsDir = path.join(__dirname, 'public/images/uploads');

// 生成hash
function generateShortHash(text) {
  return crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
}

// 下载图片
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : https;

    const request = protocol.get(url, (response) => {
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

async function main() {
  console.log('开始处理文章: 61aa2977.md\n');

  let content = fs.readFileSync(articlePath, 'utf-8');
  const articleHash = '61aa2977';

  // 匹配直接的Gitee链接
  const giteeRegex = /!\[.*?\]\((https:\/\/gitee\.com\/SherryBX\/img\/raw\/master\/([^)]+))\)/g;
  const matches = [...content.matchAll(giteeRegex)];

  console.log(`找到 ${matches.length} 张图片\n`);

  for (const match of matches) {
    const giteeUrl = match[1];
    const filename = match[2];
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);

    // 生成新文件名
    const newFilename = `${articleHash}-${basename}${ext}`;
    const fullPath = path.join(uploadsDir, newFilename);

    console.log(`下载: ${filename}`);

    try {
      // 尝试通过weserv代理下载
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(giteeUrl)}`;
      await downloadImage(proxyUrl, fullPath);

      // 替换文章中的链接
      content = content.replace(match[0], `![](/images/uploads/${newFilename})`);
    } catch (error) {
      console.log(`  ✗ 下载失败: ${error.message}`);
      // 尝试直接从Gitee下载
      try {
        console.log(`  尝试直接从Gitee下载...`);
        await downloadImage(giteeUrl, fullPath);
        content = content.replace(match[0], `![](/images/uploads/${newFilename})`);
      } catch (error2) {
        console.log(`  ✗ 直接下载也失败: ${error2.message}`);
      }
    }

    // 添加延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 写回文章
  fs.writeFileSync(articlePath, content, 'utf-8');

  console.log('\n完成!');
  console.log(`已更新文章: ${articlePath}`);
}

main().catch(console.error);
