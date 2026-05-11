var __defProp = Object.defineProperty
var __name = (target, value) => __defProp(target, 'name', { value, configurable: true })

// src/index.js
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
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
      const path = searchParams.get('path')
      const page = parseInt(searchParams.get('page') || '1')
      const pageSize = parseInt(searchParams.get('pageSize') || '10')
      if (!path) {
        return new Response(JSON.stringify({ errmsg: 'path is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { results: comments } = await env.DB.prepare(
        `SELECT * FROM wl_comment WHERE url = ? AND pid IS NULL AND status = 'approved' ORDER BY insertedAt DESC LIMIT ? OFFSET ?`,
      )
        .bind(path, pageSize, (page - 1) * pageSize)
        .all()
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
      const { results: countResult } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM wl_comment WHERE url = ? AND status = 'approved'`,
      )
        .bind(path)
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
      const { results: inserted } = await env.DB.prepare(`SELECT * FROM wl_comment WHERE id = ?`)
        .bind(insertedId)
        .all()
      return new Response(JSON.stringify({ errno: 0, data: inserted[0] }), {
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
    return new Response('Waline Comment Service', { headers: corsHeaders })
  },
}
export { index_default as default }
//# sourceMappingURL=index.js.map
