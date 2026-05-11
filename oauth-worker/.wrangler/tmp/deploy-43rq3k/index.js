// src/index.js
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url)
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://sherry77.me',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code')
      if (!code) {
        return new Response('Missing code parameter', { status: 400 })
      }
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.OAUTH_CLIENT_ID,
          client_secret: env.OAUTH_CLIENT_SECRET,
          code,
        }),
      })
      const data = await tokenResponse.json()
      if (data.error) {
        return new Response(JSON.stringify(data), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>\u8BA4\u8BC1\u6210\u529F</title>
          <script>
            (function() {
              const data = ${JSON.stringify(data)};
              const message = 'authorization:github:success:' + JSON.stringify(data);
              window.opener.postMessage(message, 'https://sherry77.me');
              setTimeout(function() { window.close(); }, 1000);
            })();
          <\/script>
        </head>
        <body>
          <p>\u8BA4\u8BC1\u6210\u529F\uFF01\u6B63\u5728\u5173\u95ED\u7A97\u53E3...</p>
        </body>
        </html>
      `
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      })
    }
    if (url.pathname === '/auth') {
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${env.OAUTH_CLIENT_ID}&scope=repo,user`
      return Response.redirect(authUrl, 302)
    }
    return new Response('Decap CMS OAuth Provider', { headers: corsHeaders })
  },
}
export { index_default as default }
//# sourceMappingURL=index.js.map
