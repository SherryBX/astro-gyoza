import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const postsDir = path.join(rootDir, 'src/content/posts');
const uploadsDir = path.join(rootDir, 'public/images/uploads');

function generateShortHash(text) {
  return crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
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
          fs.unlinkSync(filepath);
          reject(new Error(`Downloaded file is empty`));
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

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function processArticle(articlePath) {
  let content = fs.readFileSync(articlePath, 'utf-8');
  const filename = path.basename(articlePath, '.md');
  let hasChanges = false;

  // 匹配两种Gitee链接格式
  const patterns = [
    // 直接Gitee链接: https://gitee.com/SherryBX/img/raw/master/xxx.png
    /!\[([^\]]*)\]\((https:\/\/gitee\.com\/SherryBX\/img\/raw\/master\/([^)]+))\)/g,
    // weserv代理链接: //images.weserv.nl/?url=https://gitee.com/...
    /!\[([^\]]*)\]\((\/\/images\.weserv\.nl\/\?url=https:\/\/gitee\.com\/SherryBX\/img\/raw\/master\/([^)]+))\)/g,
  ];

  for (const pattern of patterns) {
    const matches = [...content.matchAll(pattern)];

    for (const match of matches) {
      const alt = match[1];
      const originalUrl = match[2];
      const imageFilename = match[3];
      const ext = path.extname(imageFilename);
      const basename = path.basename(imageFilename, ext);

      const newFilename = `${filename}-${basename}${ext}`;
      const fullPath = path.join(uploadsDir, newFilename);

      // 如果图片已存在且大小>0，跳过
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.size > 0) {
          console.log(`  ✓ ${newFilename} already exists (${stats.size} bytes)`);
          content = content.replace(match[0], `![${alt}](/images/uploads/${newFilename})`);
          hasChanges = true;
          continue;
        }
      }

      console.log(`  下载: ${imageFilename}`);

      try {
        // 构建Gitee URL
        const giteeUrl = `https://gitee.com/SherryBX/img/raw/master/${imageFilename}`;
        const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(giteeUrl)}`;

        await downloadImage(proxyUrl, fullPath);
        content = content.replace(match[0], `![${alt}](/images/uploads/${newFilename})`);
        hasChanges = true;
      } catch (error) {
        console.log(`  ✗ 下载失败: ${error.message}`);
        try {
          console.log(`  尝试直接从Gitee下载...`);
          const giteeUrl = `https://gitee.com/SherryBX/img/raw/master/${imageFilename}`;
          await downloadImage(giteeUrl, fullPath);
          content = content.replace(match[0], `![${alt}](/images/uploads/${newFilename})`);
          hasChanges = true;
        } catch (error2) {
          console.log(`  ✗ 直接下载也失败: ${error2.message}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (hasChanges) {
    fs.writeFileSync(articlePath, content, 'utf-8');
    console.log(`✓ 已更新文章: ${path.basename(articlePath)}\n`);
    return true;
  }

  return false;
}

async function main() {
  console.log('检测文章中的Gitee图片链接...\n');

  // 获取最近一次commit修改的文章
  let changedFiles = [];
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
    changedFiles = output
      .split('\n')
      .filter(f => f.startsWith('src/content/posts/') && f.endsWith('.md'))
      .map(f => path.join(rootDir, f));
  } catch (error) {
    console.log('无法获取git diff，将扫描所有文章');
    changedFiles = fs.readdirSync(postsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(postsDir, f));
  }

  if (changedFiles.length === 0) {
    console.log('没有检测到文章变更');
    return;
  }

  console.log(`检测到 ${changedFiles.length} 篇文章需要处理\n`);

  let totalProcessed = 0;
  for (const articlePath of changedFiles) {
    if (!fs.existsSync(articlePath)) continue;

    console.log(`处理文章: ${path.basename(articlePath)}`);

    const content = fs.readFileSync(articlePath, 'utf-8');
    const hasGiteeLinks = /gitee\.com|images\.weserv\.nl/.test(content);

    if (!hasGiteeLinks) {
      console.log('  没有Gitee链接\n');
      continue;
    }

    const processed = await processArticle(articlePath);
    if (processed) totalProcessed++;
  }

  console.log(`\n完成! 共处理 ${totalProcessed} 篇文章`);
}

main().catch(console.error);
