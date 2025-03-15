const http = require("http");
const fs = require("fs");
const appAssert = require("./appAssert");

function createClientPageServer(serverArgs, htmlFilePath) {
  appAssert(
    serverArgs !== undefined,
    "Failed to create load balancer",
    "serverArgs was not passed\nserverArgs: { serverId: Number, hostname: String, ip: String, port: Number }"
  );

  const { serverId, hostname, ip, port } = serverArgs;

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
    htmlFilePath !== undefined,
    "Failed to create client page server",
    "htmlFilePath (string) was not passed"
  );

  const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/") {
      fs.readFile(htmlFilePath, (error, data) => {
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
      });
    } else {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain");
      res.end("Error 400: Bad Request");
    }
  });

  console.log(
    `\x1b[32m✔\x1b[0m [ OK ] Client Page Server created - ${hostname} #${serverId}`
  );

  return {
    id: serverId,
    hostname,
    ip,
    port,
    start: () => {
      server.listen(port);

      console.log(
        `🟢 [ ${hostname} #${serverId} ] Listening on port ${port}...`
      );
    },
    close: () => {
      server.close();

      console.log(`🔴 [ ${hostname} #${serverId} ] Server closed`);
    },
  };
}

module.exports = createClientPageServer;
