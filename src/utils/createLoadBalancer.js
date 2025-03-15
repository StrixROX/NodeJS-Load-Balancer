const http = require("http");
const appAssert = require("./appAssert");

function createLoadBalancer(serverArgs, serverPool, getNextServerIndex) {
  appAssert(
    serverArgs !== undefined,
    "Failed to create load balancer",
    "serverArgs was not passed\nserverArgs: { serverId: Number, hostname: String, ip: String, port: Number }"
  );

  const { serverId, hostname, ip, port, allowOrigin } = serverArgs;

  appAssert(
    serverId !== undefined,
    "Failed to create load balancer",
    "serverId is required in serverArgs"
  );
  appAssert(
    hostname !== undefined,
    "Failed to create load balancer",
    "hostname is required in serverArgs"
  );
  appAssert(
    ip !== undefined,
    "Failed to create load balancer",
    "ip is required in serverArgs"
  );
  appAssert(
    port !== undefined,
    "Failed to create load balancer",
    "port is required in serverArgs"
  );
  appAssert(
    allowOrigin !== undefined,
    "Failed to create load balancer",
    "allowOrigin is required in serverArgs"
  );

  appAssert(
    serverPool !== undefined,
    "Failed to create load balancer",
    "serverPool (ServerPool) was not passed"
  );

  appAssert(
    getNextServerIndex !== undefined,
    "Failed to create load balancer",
    "getNextServerIndex ((serverPool: ServerPool, currentServerIndex: Number) => Number) was not passed"
  );

  let currentServerIndex = -1;

  function getServer() {
    currentServerIndex = getNextServerIndex(serverPool, currentServerIndex);
    return serverPool.servers[currentServerIndex];
  }

  const server = http.createServer((req, res) => {
    if (req.headers.origin !== allowOrigin) {
      res.statusCode = 403;
      res.setHeader("Content-Type", "text/plain");
      res.end("Error 403: Forbidden");
    } else if (req.method === "POST" && req.url === "/") {
      // POST "/"

      const serverFromPool = getServer();
      const { hostname: targetHostname, port: targetPort } = serverFromPool;

      const proxyReq = http.request(
        {
          host: targetHostname,
          port: targetPort,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, origin: `http://${hostname}:${port}` },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            "access-control-allow-origin": allowOrigin,
          });
          proxyRes.pipe(res);

          proxyRes.on("end", () => {
            res.end();

            proxyReq.socket.destroy();
          });
        }
      );

      req.pipe(proxyReq);

      proxyReq.on("error", (error) => {
        console.error(error);

        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("access-control-allow-origin", allowOrigin);
        res.end("Error 500: Internal Server Error");
      });
    } else {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("access-control-allow-origin", allowOrigin);
      res.end("Error 400: Bad Request");
    }
  });

  console.log(
    `\x1b[32m✔\x1b[0m [ OK ] Load Balancer created - ${hostname} #${serverId}`
  );

  return {
    id: serverId,
    hostname,
    ip,
    port,
    start: () => {
      server.listen(port);

      console.log(
        `🔷 [ ${hostname} #${serverId} ] Listening on port ${port}...`
      );
    },
    close: () => {
      console.log(`♦️ [ ${hostname} #${serverId} ] Server closed`);

      server.close();
    },
  };
}

module.exports = createLoadBalancer;
