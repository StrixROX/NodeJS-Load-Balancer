const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

class RoundRobinLoadBalancer {
  constructor(serverPool, { serverId, hostname, ip, port }) {
    this.serverPool = serverPool;

    this.hostname = hostname;
    this.serverId = serverId;
    this.ip = ip;
    this.port = port;

    this.server = this.createServer();

    this.nextServerIndex = 0;
  }

  _getServer() {
    const nextServer = this.serverPool.servers[this.nextServerIndex];

    this.nextServerIndex = (this.nextServerIndex + 1) % this.serverPool.size;

    return nextServer;
  }

  createServer() {
    const server = http.createServer((req, res) => {
      if (req.method === "GET" && req.url === "/") {
        // GET "/"

        fs.readFile(
          path.join(__dirname, "../../../public/index.html"),
          (err, data) => {
            if (err) {
              console.log(err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "text/plain");
              res.end("Error 500: Internal Server Error");
            } else {
              res.statusCode = 200;
              res.setHeader("Content-Type", "text/html");
              res.end(data);
            }
          }
        );
      } else if (req.method === "POST" && req.url === "/server") {
        // POST "/server"

        const serverFromPool = this._getServer();
        const { address, port } = serverFromPool.address();

        const proxyReq = http.request(
          {
            host: address !== "::" ? address : "localhost",
            port: port,
            path: req.url,
            method: req.method,
            headers: req.headers,
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
          }
        );

        req.pipe(proxyReq);

        proxyReq.on("error", (error) => {
          console.error(error);

          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain");
          res.end("Error 500: Internal Server Error");
        });
      } else {
        res.statusCode = 400;
        res.setHeader("Content-Type", "text/plain");
        res.end("Error 400: Bad Request");
      }
    });

    server.listen(this.port);

    console.log(
      `🔷 Load Balancer created - ${this.hostname} #${this.serverId}\n[${this.ip}:${this.port}] Listening on port ${this.port}...\n`
    );

    return server;
  }
}

module.exports = RoundRobinLoadBalancer;
