const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const appAssert = require("./appAssert");

function createLoadBalancer(serverArgs, serverPool, getNextServerIndex) {
  let currentServerIndex = 0;

  function getServer() {
    appAssert(
      serverPool !== undefined,
      "Unable to find servers",
      "serverPool (ServerPool) was not passed"
    );

    appAssert(
      getNextServerIndex !== undefined,
      "Unable to find servers",
      "getNextServerIndex ((serverPool: ServerPool, currentServerIndex: Number) => Number) was not passed"
    );

    const server = serverPool.servers[currentServerIndex];
    const nextServerIndex = getNextServerIndex(serverPool, currentServerIndex);
    currentServerIndex = nextServerIndex;

    return server;
  }

  appAssert(
    serverArgs !== undefined,
    "Failed to create server",
    "serverArgs was not passed\nserverArgs: { serverId: Number, hostname: String, ip: String, port: Number }"
  );

  const { serverId, hostname, ip, port } = serverArgs;

  appAssert(
    serverId !== undefined,
    "Failed to create server",
    "serverId is required in serverArgs"
  );
  appAssert(
    hostname !== undefined,
    "Failed to create server",
    "hostname is required in serverArgs"
  );
  appAssert(
    ip !== undefined,
    "Failed to create server",
    "ip is required in serverArgs"
  );
  appAssert(
    port !== undefined,
    "Failed to create server",
    "port is required in serverArgs"
  );

  const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/") {
      // GET "/"

      fs.readFile(
        path.join(__dirname, "../../public/index.html"),
        (error, data) => {
          if (error) {
            console.error(error);
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("Error 404: Not Found");
          } else {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html");
            res.end(data);
          }
        }
      );
    } else if (req.method === "POST" && req.url === "/server") {
      // POST "/server"

      const serverFromPool = getServer();
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
