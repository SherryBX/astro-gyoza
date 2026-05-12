var __defProp = Object.defineProperty
var __name = (target, value) => __defProp(target, 'name', { value, configurable: true })

// src/index.js
function convertDates(comment) {
  if (comment.insertedAt) {
    comment.insertedAt = Math.floor(new Date(comment.insertedAt).getTime() / 1e3)
  }
  if (comment.createdAt) {
    comment.createdAt = Math.floor(new Date(comment.createdAt).getTime() / 1e3)
  }
  if (comment.updatedAt) {
    comment.updatedAt = Math.floor(new Date(comment.updatedAt).getTime() / 1e3)
  }
  return comment
}
__name(convertDates, 'convertDates')
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }
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
    const { pathname } = url
    if (pathname === '/api/comment' && request.method === 'GET') {
      const { searchParams } = url
      let path = searchParams.get('path')
      const page = parseInt(searchParams.get('page') || '1')
      const pageSize = parseInt(searchParams.get('pageSize') || '10')
      if (!path) {
        return new Response(JSON.stringify({ errmsg: 'path is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      path = path.replace(/\/$/, '')
      const { results: comments } = await env.DB.prepare(
        `SELECT id, user_id, comment, insertedAt, link, mail, nick, pid, rid, ip, status, ua, url, createdAt, updatedAt FROM wl_comment WHERE (url = ? OR url = ?) AND pid IS NULL AND status = 'approved' ORDER BY insertedAt DESC LIMIT ? OFFSET ?`,
      )
        .bind(path, path + '/', pageSize, (page - 1) * pageSize)
        .all()
      comments.forEach((c) => {
        c.like_count = 0
        convertDates(c)
      })
      const commentIds = comments.map((c) => c.id)
      let replies = []
      if (commentIds.length > 0) {
        const placeholders = commentIds.map(() => '?').join(',')
        const { results: replyResults } = await env.DB.prepare(
          `SELECT id, user_id, comment, insertedAt, link, mail, nick, pid, rid, ip, status, ua, url, createdAt, updatedAt FROM wl_comment WHERE pid IN (${placeholders}) AND status = 'approved' ORDER BY insertedAt ASC`,
        )
          .bind(...commentIds)
          .all()
        replies = replyResults
        replies.forEach((c) => {
          c.like_count = 0
          convertDates(c)
        })
      }
      const { results: countResult } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM wl_comment WHERE (url = ? OR url = ?) AND status = 'approved'`,
      )
        .bind(path, path + '/')
        .all()
      const count = countResult[0]?.count || 0
      const replyMap = {}
      for (const r of replies) {
        if (!replyMap[r.pid]) replyMap[r.pid] = []
        replyMap[r.pid].push(r)
      }
      const buildTree = /* @__PURE__ */ __name((comment) => {
        const c = { ...comment, children: replyMap[comment.id] || [] }
        c.children = c.children.map(buildTree)
        return c
      }, 'buildTree')
      const tree = comments.map(buildTree)
      return new Response(
        JSON.stringify({ errno: 0, data: { page, pageSize, count, data: tree } }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }
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
          nick || '\u533F\u540D',
          pid || null,
          rid || null,
          commentUrl,
          ip,
          ua || null,
        )
        .run()
      const insertedId = meta.last_row_id
      const { results: inserted } = await env.DB.prepare(
        `SELECT id, user_id, comment, insertedAt, link, mail, nick, pid, rid, ip, status, ua, url, createdAt, updatedAt FROM wl_comment WHERE id = ?`,
      )
        .bind(insertedId)
        .all()
      const insertedComment = inserted[0]
      if (insertedComment) {
        insertedComment.like_count = 0
        convertDates(insertedComment)
      }
      return new Response(JSON.stringify({ errno: 0, data: insertedComment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
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
        const { results: results2 } = await env.DB.prepare(
          `SELECT url, COUNT(*) as count FROM wl_comment WHERE url IN (${placeholders}) AND status = 'approved' GROUP BY url`,
        )
          .bind(...urlList)
          .all()
        return new Response(JSON.stringify({ errno: 0, data: results2 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { results } = await env.DB.prepare(
        `SELECT url, time FROM wl_counter WHERE url IN (${placeholders})`,
      )
        .bind(...urlList)
        .all()
      return new Response(JSON.stringify({ errno: 0, data: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
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
    if (pathname === '/ui' || pathname === '/ui/') {
      return new Response(getAdminHTML(), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
    if (pathname === '/api/admin/comments' && request.method === 'GET') {
      const { searchParams } = url
      const page = parseInt(searchParams.get('page') || '1')
      const pageSize = parseInt(searchParams.get('pageSize') || '20')
      const { results: comments } = await env.DB.prepare(
        `SELECT id, user_id, comment, insertedAt, link, mail, nick, pid, rid, ip, status, ua, url, createdAt, updatedAt FROM wl_comment ORDER BY insertedAt DESC LIMIT ? OFFSET ?`,
      )
        .bind(pageSize, (page - 1) * pageSize)
        .all()
      comments.forEach((c) => {
        c.like_count = 0
        convertDates(c)
      })
      const { results: countResult } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM wl_comment`,
      ).all()
      const totalCount = countResult[0]?.count || 0
      const { results: statusCounts } = await env.DB.prepare(
        `SELECT status, COUNT(*) as count FROM wl_comment GROUP BY status`,
      ).all()
      const stats = {
        total: totalCount,
        approved: statusCounts.find((s) => s.status === 'approved')?.count || 0,
        waiting: statusCounts.find((s) => s.status === 'waiting')?.count || 0,
        spam: statusCounts.find((s) => s.status === 'spam')?.count || 0,
      }
      return new Response(
        JSON.stringify({ errno: 0, data: { comments, count: totalCount, page, pageSize, stats } }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }
    if (pathname.startsWith('/api/admin/comment/') && request.method === 'DELETE') {
      const commentId = pathname.split('/').pop()
      await env.DB.prepare(`DELETE FROM wl_comment WHERE id = ?`).bind(commentId).run()
      return new Response(JSON.stringify({ errno: 0, message: 'Comment deleted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
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
  <title>Waline \u7BA1\u7406\u540E\u53F0</title>
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
    <h1>Waline \u7BA1\u7406\u540E\u53F0</h1>
  </div>
  <div class="container">
    <div class="stats">
      <div class="stat-card">
        <h3>\u603B\u8BC4\u8BBA\u6570</h3>
        <div class="number" id="totalComments">-</div>
      </div>
      <div class="stat-card">
        <h3>\u5F85\u5BA1\u6838</h3>
        <div class="number" id="pendingComments">-</div>
      </div>
      <div class="stat-card">
        <h3>\u5DF2\u901A\u8FC7</h3>
        <div class="number" id="approvedComments">-</div>
      </div>
    </div>
    <div class="comments" id="commentsList">
      <div class="loading">\u52A0\u8F7D\u4E2D...</div>
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
        document.getElementById('commentsList').innerHTML = '<div class="empty">\u52A0\u8F7D\u5931\u8D25</div>';
      }
    }

    function renderComments(comments) {
      const container = document.getElementById('commentsList');

      if (comments.length === 0) {
        container.innerHTML = '<div class="empty">\u6682\u65E0\u8BC4\u8BBA</div>';
        return;
      }

      container.innerHTML = comments.map(comment => \`
        <div class="comment" data-id="\${comment.id}">
          <div class="comment-header">
            <div class="comment-meta">
              <span><strong>\${comment.nick || '\u533F\u540D'}</strong></span>
              <span>\${comment.mail || ''}</span>
              <span>\${new Date(comment.insertedAt).toLocaleString('zh-CN')}</span>
              <span>\u72B6\u6001: \${getStatusText(comment.status)}</span>
            </div>
          </div>
          <div class="comment-content">\${escapeHtml(comment.comment)}</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 10px;">
            \u6587\u7AE0: \${comment.url}
          </div>
          <div class="comment-actions">
            \${comment.status !== 'approved' ? \`<button class="btn btn-approve" onclick="updateStatus(\${comment.id}, 'approved')">\u901A\u8FC7</button>\` : ''}
            \${comment.status !== 'spam' ? \`<button class="btn btn-spam" onclick="updateStatus(\${comment.id}, 'spam')">\u6807\u8BB0\u5783\u573E</button>\` : ''}
            <button class="btn btn-delete" onclick="deleteComment(\${comment.id})">\u5220\u9664</button>
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
        <button onclick="changePage(\${currentPage - 1})" \${currentPage === 1 ? 'disabled' : ''}>\u4E0A\u4E00\u9875</button>
        <span>\u7B2C \${currentPage} / \${totalPages} \u9875</span>
        <button onclick="changePage(\${currentPage + 1})" \${currentPage === totalPages ? 'disabled' : ''}>\u4E0B\u4E00\u9875</button>
      \`;
    }

    function updateStats(comments) {
      document.getElementById('totalComments').textContent = comments.length;
      document.getElementById('pendingComments').textContent = comments.filter(c => c.status === 'waiting').length;
      document.getElementById('approvedComments').textContent = comments.filter(c => c.status === 'approved').length;
    }

    async function deleteComment(id) {
      if (!confirm('\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u6761\u8BC4\u8BBA\u5417\uFF1F')) return;

      try {
        await fetch(\`/api/admin/comment/\${id}\`, { method: 'DELETE' });
        loadComments();
      } catch (error) {
        alert('\u5220\u9664\u5931\u8D25');
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
        alert('\u66F4\u65B0\u5931\u8D25');
      }
    }

    function changePage(page) {
      currentPage = page;
      loadComments();
    }

    function getStatusText(status) {
      const map = { approved: '\u5DF2\u901A\u8FC7', waiting: '\u5F85\u5BA1\u6838', spam: '\u5783\u573E\u8BC4\u8BBA' };
      return map[status] || status;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    loadComments();
  <\/script>
</body>
</html>`
}
__name(getAdminHTML, 'getAdminHTML')
export { index_default as default }
//# sourceMappingURL=index.js.map
