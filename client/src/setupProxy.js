const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/v1.0',
    createProxyMiddleware({
      target: 'https://openapi.tuyaus.com',
      changeOrigin: true,
    //   pathRewrite: {
    //     '^/v1.0': '/v1.0', // Rewrite paths if needed
    //   },
      onProxyReq: (proxyReq, req, res) => {
        // Optionally modify the proxy request here
      },
      onProxyRes: function (proxyRes, req, res) {
        // Add CORS headers to response
        proxyRes.headers['Access-Control-Allow-Origin'] = '*'; // Allow all origins
      },
    })
  );
};
