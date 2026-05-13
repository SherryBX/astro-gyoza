export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Allowed GitHub users (whitelist)
    const ALLOWED_USERS = ['SherryBX']

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://sherry77.me',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // OAuth callback
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code')

      if (!code) {
        return new Response('Missing code parameter', { status: 400 })
      }

      // Exchange code for token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.OAUTH_CLIENT_ID,
          client_secret: env.OAUTH_CLIENT_SECRET,
          code: code,
        }),
      })

      const data = await tokenResponse.json()

      if (data.error) {
        return new Response(JSON.stringify(data), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify user is in whitelist
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: 'application/json',
        },
      })

      const user = await userResponse.json()

      if (!ALLOWED_USERS.includes(user.login)) {
        return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Access denied' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Return success page with token
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>认证成功</title>
          <script>
            (function() {
              if (!window.opener) {
                document.body.innerHTML = '<p>错误：无法找到父窗口</p>';
                return;
              }

              function receiveMessage(e) {
                // Send authorization result back to parent
                const content = {
                  token: '${data.access_token}',
                  provider: 'github'
                };
                const message = 'authorization:github:success:' + JSON.stringify(content);

                window.opener.postMessage(message, e.origin);

                setTimeout(function() {
                  window.close();
                }, 2000);
              }

              // Listen for handshake from parent
              window.addEventListener('message', receiveMessage, false);

              // Start handshake with parent
              window.opener.postMessage('authorizing:github', '*');
            })();
          </script>
        </head>
        <body>
          <p>认证成功！正在关闭窗口...</p>
        </body>
        </html>
      `

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      })
    }

    // Auth endpoint
    if (url.pathname === '/auth') {
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${env.OAUTH_CLIENT_ID}&scope=repo,user`

      return Response.redirect(authUrl, 302)
    }

    return new Response('Decap CMS OAuth Provider', { headers: corsHeaders })
  },
}
