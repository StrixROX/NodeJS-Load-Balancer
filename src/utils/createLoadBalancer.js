const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

function createLoadBalancer(
  serverPool,
  { serverId, hostname, ip, port },
  getNextServerIndex
) {
  let currentServerIndex = 0;

  const _getNextServer = () => {
    if (!getNextServerIndex) {
      throw new Error(
        "Failed to handle request: getNextServerIndex method is not defined"
      );
    }

    if (!serverPool) {
      throw new Error("Failed to handle request: serverPool is not defined");
    }

    const { server, nextServerIndex } = getNextServerIndex(
      serverPool,
      currentServerIndex
    );
    currentServerIndex = nextServerIndex;

    return server;
  };

  const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/") {
      // GET "/"

      fs.readFile(
        path.join(__dirname, "../../public/index.html"),
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

      const serverFromPool = _getNextServer();
      const { hostname, port } = serverFromPool;

      const proxyReq = http.request(
        {
          host: hostname,
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

  console.log(
    `\x1b[32m✔\x1b[0m [ OK ] Load Balancer created - ${hostname} #${serverId}`
  );

  return {
    start: () => {
      server.listen(port);

      console.log(
        `🔷 [ ${hostname} #${serverId} ] Listening on port ${port}...`
      );
    },
  };
}

module.exports = createLoadBalancer;
