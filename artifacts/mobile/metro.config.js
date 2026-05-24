const { getDefaultConfig } = require("expo/metro-config");
const http = require("http");

const config = getDefaultConfig(__dirname);

config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith("/api")) {
        const options = {
          hostname: "localhost",
          port: 8080,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: "localhost:8080" },
        };
        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });
        proxyReq.on("error", (err) => {
          console.error("[proxy] API error:", err.message);
          res.writeHead(502);
          res.end("Bad Gateway");
        });
        req.pipe(proxyReq, { end: true });
      } else {
        middleware(req, res, next);
      }
    };
  },
};

module.exports = config;
