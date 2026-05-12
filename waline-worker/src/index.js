export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Init DB tables on first request
    if (url.pathname === '/api/init') {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS wl_comment (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          comment TEXT,
          insertedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          link TEXT,
          mail TEXT,
          nick TEXT,
          pid INTEGER,
          rid INTEGER,
          ip TEXT,
          status VARCHAR DEFAULT 'approved',
          like INTEGER DEFAULT 0,
          ua TEXT,
          url TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS wl_counter (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          time INTEGER DEFAULT 0,
          url VARCHAR UNIQUE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS wl_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          display_name VARCHAR,
          email VARCHAR,
          password VARCHAR,
          type VARCHAR DEFAULT 'guest',
          status VARCHAR DEFAULT 'active',
          avatar TEXT,
          github INTEGER,
          github_login VARCHAR,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)
      return new Response(JSON.stringify({ message: 'Database initialized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Forward to Waline's official Cloudflare Worker adapter
    // We use the @waline/cloudflare adapter pattern
    const { pathname } = url

    // GET /api/comment - list comments
    if (pathname === '/api/comment' && request.method === 'GET') {
      const { searchParams } = url
      const path = searchParams.get('path')
      const page = parseInt(searchParams.get('page') || '1')
      const pageSize = parseInt(searchParams.get('pageSize') || '10')

      if (!path) {
        return new Response(JSON.stringify({ errmsg: 'path is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get root comments
      const { results: comments } = await env.DB.prepare(
        `SELECT * FROM wl_comment WHERE url = ? AND pid IS NULL AND status = 'approved' ORDER BY insertedAt DESC LIMIT ? OFFSET ?`,
      )
        .bind(path, pageSize, (page - 1) * pageSize)
        .all()

      // Get replies for each root comment
      const commentIds = comments.map((c) => c.id)
      let replies = []
      if (commentIds.length > 0) {
        const placeholders = commentIds.map(() => '?').join(',')
        const { results: replyResults } = await env.DB.prepare(
          `SELECT * FROM wl_comment WHERE pid IN (${placeholders}) AND status = 'approved' ORDER BY insertedAt ASC`,
        )
          .bind(...commentIds)
          .all()
        replies = replyResults
      }

      // Get count
      const { results: countResult } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM wl_comment WHERE url = ? AND status = 'approved'`,
      )
        .bind(path)
        .all()
      const count = countResult[0]?.count || 0

      // Build tree
      const replyMap = {}
      for (const r of replies) {
        if (!replyMap[r.pid]) replyMap[r.pid] = []
        replyMap[r.pid].push(r)
      }

      const buildTree = (comment) => {
        const c = { ...comment, children: replyMap[comment.id] || [] }
        c.children = c.children.map(buildTree)
        return c
      }

      const tree = comments.map(buildTree)

      return new Response(
        JSON.stringify({ errno: 0, data: { page, pageSize, count, data: tree } }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // POST /api/comment - add comment
    if (pathname === '/api/comment' && request.method === 'POST') {
      const body = await request.json()
      const { comment, link, mail, nick, pid, rid, url: commentUrl, ua } = body

      if (!comment || !commentUrl) {
        return new Response(JSON.stringify({ errmsg: 'comment and url are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const ip = request.headers.get('CF-Connecting-IP') || ''

      const { meta } = await env.DB.prepare(
        `INSERT INTO wl_comment (comment, link, mail, nick, pid, rid, url, ip, ua, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      )
        .bind(
          comment,
          link || null,
          mail || null,
          nick || '匿名',
          pid || null,
          rid || null,
          commentUrl,
          ip,
          ua || null,
        )
        .run()

      const insertedId = meta.last_row_id

      const { results: inserted } = await env.DB.prepare(`SELECT * FROM wl_comment WHERE id = ?`)
        .bind(insertedId)
        .all()

      return new Response(JSON.stringify({ errno: 0, data: inserted[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /api/count - get page view / comment count
    if (pathname === '/api/count' && request.method === 'GET') {
      const { searchParams } = url
      const urls = searchParams.get('urls')
      const type = searchParams.get('type') || 'comment'

      if (!urls) {
        return new Response(JSON.stringify({ errmsg: 'urls is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const urlList = urls.split(',').filter(Boolean)
      if (urlList.length === 0) {
        return new Response(JSON.stringify({ errno: 0, data: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const placeholders = urlList.map(() => '?').join(',')

      if (type === 'comment') {
        const { results } = await env.DB.prepare(
          `SELECT url, COUNT(*) as count FROM wl_comment WHERE url IN (${placeholders}) AND status = 'approved' GROUP BY url`,
        )
          .bind(...urlList)
          .all()
        return new Response(JSON.stringify({ errno: 0, data: results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // type === 'time' (page views)
      const { results } = await env.DB.prepare(
        `SELECT url, time FROM wl_counter WHERE url IN (${placeholders})`,
      )
        .bind(...urlList)
        .all()
      return new Response(JSON.stringify({ errno: 0, data: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /api/count - increment page view
    if (pathname === '/api/count' && request.method === 'POST') {
      const body = await request.json()
      const { url: countUrl } = body

      if (!countUrl) {
        return new Response(JSON.stringify({ errmsg: 'url is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await env.DB.prepare(
        `INSERT INTO wl_counter (url, time) VALUES (?, 1) ON CONFLICT(url) DO UPDATE SET time = time + 1, updatedAt = CURRENT_TIMESTAMP`,
      )
        .bind(countUrl)
        .run()

      const { results } = await env.DB.prepare(`SELECT url, time FROM wl_counter WHERE url = ?`)
        .bind(countUrl)
        .all()

      return new Response(JSON.stringify({ errno: 0, data: results[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin UI
    if (pathname === '/ui' || pathname === '/ui/') {
      return new Response(getAdminHTML(), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // Admin API - List all comments
    if (pathname === '/api/admin/comments' && request.method === 'GET') {
      const { searchParams } = url
      const page = parseInt(searchParams.get('page') || '1')
      const pageSize = parseInt(searchParams.get('pageSize') || '20')

      const { results: comments } = await env.DB.prepare(
        `SELECT * FROM wl_comment ORDER BY insertedAt DESC LIMIT ? OFFSET ?`,
      )
        .bind(pageSize, (page - 1) * pageSize)
        .all()

      const { results: countResult } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM wl_comment`,
      ).all()
      const count = countResult[0]?.count || 0

      return new Response(JSON.stringify({ errno: 0, data: { comments, count, page, pageSize } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin API - Delete comment
    if (pathname.startsWith('/api/admin/comment/') && request.method === 'DELETE') {
      const commentId = pathname.split('/').pop()
      await env.DB.prepare(`DELETE FROM wl_comment WHERE id = ?`).bind(commentId).run()
      return new Response(JSON.stringify({ errno: 0, message: 'Comment deleted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin API - Update comment status
    if (pathname.startsWith('/api/admin/comment/') && request.method === 'PATCH') {
      const commentId = pathname.split('/').pop()
      const body = await request.json()
      const { status } = body

      await env.DB.prepare(`UPDATE wl_comment SET status = ? WHERE id = ?`)
        .bind(status, commentId)
        .run()

      return new Response(JSON.stringify({ errno: 0, message: 'Comment updated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response('Waline Comment Service', { headers: corsHeaders })
  },
}

function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Waline 管理后台</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
    .header { background: #fff; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header h1 { font-size: 24px; color: #333; }
    .container { max-width: 1200px; margin: 20px auto; padding: 0 20px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .stat-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-card h3 { font-size: 14px; color: #666; margin-bottom: 10px; }
    .stat-card .number { font-size: 32px; font-weight: bold; color: #333; }
    .comments { background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .comment { padding: 20px; border-bottom: 1px solid #eee; }
    .comment:last-child { border-bottom: none; }
    .comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .comment-meta { display: flex; gap: 15px; font-size: 14px; color: #666; }
    .comment-content { color: #333; line-height: 1.6; margin-bottom: 10px; }
    .comment-actions { display: flex; gap: 10px; }
    .btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .btn-delete { background: #ff4d4f; color: #fff; }
    .btn-approve { background: #52c41a; color: #fff; }
    .btn-spam { background: #faad14; color: #fff; }
    .btn:hover { opacity: 0.8; }
    .pagination { display: flex; justify-content: center; gap: 10px; padding: 20px; }
    .pagination button { padding: 8px 16px; border: 1px solid #d9d9d9; background: #fff; border-radius: 4px; cursor: pointer; }
    .pagination button:hover { border-color: #40a9ff; color: #40a9ff; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading { text-align: center; padding: 40px; color: #666; }
    .empty { text-align: center; padding: 40px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Waline 管理后台</h1>
  </div>
  <div class="container">
    <div class="stats">
      <div class="stat-card">
        <h3>总评论数</h3>
        <div class="number" id="totalComments">-</div>
      </div>
      <div class="stat-card">
        <h3>待审核</h3>
        <div class="number" id="pendingComments">-</div>
      </div>
      <div class="stat-card">
        <h3>已通过</h3>
        <div class="number" id="approvedComments">-</div>
      </div>
    </div>
    <div class="comments" id="commentsList">
      <div class="loading">加载中...</div>
    </div>
    <div class="pagination" id="pagination"></div>
  </div>

  <script>
    let currentPage = 1;
    const pageSize = 20;

    async function loadComments() {
      try {
        const res = await fetch(\`/api/admin/comments?page=\${currentPage}&pageSize=\${pageSize}\`);
        const data = await res.json();

        if (data.errno === 0) {
          renderComments(data.data.comments);
          renderPagination(data.data.count);
          updateStats(data.data.comments);
        }
      } catch (error) {
        document.getElementById('commentsList').innerHTML = '<div class="empty">加载失败</div>';
      }
    }

    function renderComments(comments) {
      const container = document.getElementById('commentsList');

      if (comments.length === 0) {
        container.innerHTML = '<div class="empty">暂无评论</div>';
        return;
      }

      container.innerHTML = comments.map(comment => \`
        <div class="comment" data-id="\${comment.id}">
          <div class="comment-header">
            <div class="comment-meta">
              <span><strong>\${comment.nick || '匿名'}</strong></span>
              <span>\${comment.mail || ''}</span>
              <span>\${new Date(comment.insertedAt).toLocaleString('zh-CN')}</span>
              <span>状态: \${getStatusText(comment.status)}</span>
            </div>
          </div>
          <div class="comment-content">\${escapeHtml(comment.comment)}</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 10px;">
            文章: \${comment.url}
          </div>
          <div class="comment-actions">
            \${comment.status !== 'approved' ? \`<button class="btn btn-approve" onclick="updateStatus(\${comment.id}, 'approved')">通过</button>\` : ''}
            \${comment.status !== 'spam' ? \`<button class="btn btn-spam" onclick="updateStatus(\${comment.id}, 'spam')">标记垃圾</button>\` : ''}
            <button class="btn btn-delete" onclick="deleteComment(\${comment.id})">删除</button>
          </div>
        </div>
      \`).join('');
    }

    function renderPagination(total) {
      const totalPages = Math.ceil(total / pageSize);
      const container = document.getElementById('pagination');

      if (totalPages <= 1) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = \`
        <button onclick="changePage(\${currentPage - 1})" \${currentPage === 1 ? 'disabled' : ''}>上一页</button>
        <span>第 \${currentPage} / \${totalPages} 页</span>
        <button onclick="changePage(\${currentPage + 1})" \${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
      \`;
    }

    function updateStats(comments) {
      document.getElementById('totalComments').textContent = comments.length;
      document.getElementById('pendingComments').textContent = comments.filter(c => c.status === 'waiting').length;
      document.getElementById('approvedComments').textContent = comments.filter(c => c.status === 'approved').length;
    }

    async function deleteComment(id) {
      if (!confirm('确定要删除这条评论吗？')) return;

      try {
        await fetch(\`/api/admin/comment/\${id}\`, { method: 'DELETE' });
        loadComments();
      } catch (error) {
        alert('删除失败');
      }
    }

    async function updateStatus(id, status) {
      try {
        await fetch(\`/api/admin/comment/\${id}\`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        loadComments();
      } catch (error) {
        alert('更新失败');
      }
    }

    function changePage(page) {
      currentPage = page;
      loadComments();
    }

    function getStatusText(status) {
      const map = { approved: '已通过', waiting: '待审核', spam: '垃圾评论' };
      return map[status] || status;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    loadComments();
  </script>
</body>
</html>`
}
