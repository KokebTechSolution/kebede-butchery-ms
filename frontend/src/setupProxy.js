const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
      onProxyReq: function(proxyReq, req, res) {
        // Remove any CORS headers from requests
        delete proxyReq.getHeader('access-control-allow-credentials');
        delete proxyReq.getHeader('Access-Control-Allow-Credentials');
        delete proxyReq.getHeader('access-control-allow-origin');
        delete proxyReq.getHeader('Access-Control-Allow-Origin');
        delete proxyReq.getHeader('access-control-allow-methods');
        delete proxyReq.getHeader('Access-Control-Allow-Methods');
        delete proxyReq.getHeader('access-control-allow-headers');
        delete proxyReq.getHeader('Access-Control-Allow-Headers');
      },
    })
  );
}; 