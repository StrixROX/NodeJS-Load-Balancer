import http from "http";

function createEchoServer({ serverId, hostname, ip, port }) {
  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain");
      res.end("Error 400: Bad Request");

      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    res.write("I Received: ");
    req.pipe(res);
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

export default createEchoServer;
