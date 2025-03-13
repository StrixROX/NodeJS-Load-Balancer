const http = require("http");

const RESPONSE_DELAY = 0;
const RESPONSE_CHUNK_DELAY = 20;

function createEchoServer({ serverId, hostname, ip, port }) {
  const server = http.createServer((req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain");
      res.end("Error 400: Bad Request");

      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    res.write(`[server #${serverId}]\nI Received:\n`);

    // let promiseChain = Promise.resolve(null);
    let promiseChain = new Promise((resolve) =>
      setTimeout(resolve, RESPONSE_DELAY)
    );

    req.on("data", (chunk) => {
      for (let i of chunk) {
        promiseChain = promiseChain.then(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              res.write(String.fromCharCode(i));
              resolve();
            }, RESPONSE_CHUNK_DELAY);
          });
        });
      }
    });
  });

  server.listen(port);

  // add custom props to server object
  server.id = serverId;
  server.hostname = hostname;
  server.ip = ip;
  server.port = port;

  console.log(
    `🟢 Server created - ${hostname} #${serverId}\n[${ip}:${port}] Listening on port ${port}...\n`
  );

  return server;
}

module.exports = createEchoServer;
