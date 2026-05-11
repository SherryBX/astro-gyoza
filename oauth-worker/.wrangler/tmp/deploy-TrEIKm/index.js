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
              console.log('OAuth callback started');
              console.log('Access token:', '${data.access_token}');
              console.log('Window opener exists:', !!window.opener);

              if (!window.opener) {
                document.body.innerHTML = '<p>\u9519\u8BEF\uFF1A\u65E0\u6CD5\u627E\u5230\u7236\u7A97\u53E3</p>';
                return;
              }

              const messageData = {
                type: 'authorization',
                provider: 'github',
                token: '${data.access_token}'
              };

              console.log('Sending message object:', messageData);

              try {
                window.opener.postMessage(messageData, window.opener.origin);
                console.log('Message sent to https://sherry77.me');

                setTimeout(function() {
                  console.log('Closing window');
                  window.close();
                }, 2000);
              } catch (e) {
                console.error('Error sending message:', e);
                document.body.innerHTML = '<p>\u9519\u8BEF\uFF1A' + e.message + '</p>';
              }
            })();
          <\/script>
        </head>
        <body>
          <p>\u8BA4\u8BC1\u6210\u529F\uFF01\u6B63\u5728\u5173\u95ED\u7A97\u53E3...</p>
          <p style="font-size: 12px; color: #666;">\u8BF7\u6253\u5F00\u6D4F\u89C8\u5668\u63A7\u5236\u53F0\u67E5\u770B\u8C03\u8BD5\u4FE1\u606F</p>
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
