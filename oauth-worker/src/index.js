export default {
  async fetch(request, env) {
    const url = new URL(request.url)

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

      // Return success page with token
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>认证成功</title>
          <script>
            (function() {
              console.log('OAuth callback started');
              console.log('Access token:', '${data.access_token}');
              console.log('Window opener exists:', !!window.opener);

              if (!window.opener) {
                document.body.innerHTML = '<p>错误：无法找到父窗口</p>';
                return;
              }

              function receiveMessage(e) {
                console.log('Received message from parent:', e);
                console.log('Message origin:', e.origin);

                // Send authorization result back to parent
                const content = {
                  token: '${data.access_token}',
                  provider: 'github'
                };
                const message = 'authorization:github:success:' + JSON.stringify(content);

                console.log('Sending authorization message:', message);
                window.opener.postMessage(message, e.origin);

                setTimeout(function() {
                  console.log('Closing window');
                  window.close();
                }, 2000);
              }

              // Listen for handshake from parent
              window.addEventListener('message', receiveMessage, false);

              // Start handshake with parent
              console.log('Sending authorizing:github handshake');
              window.opener.postMessage('authorizing:github', '*');
            })();
          </script>
        </head>
        <body>
          <p>认证成功！正在关闭窗口...</p>
          <p style="font-size: 12px; color: #666;">请打开浏览器控制台查看调试信息</p>
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
