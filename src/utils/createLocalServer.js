import http from "http";

function createLocalServer(port, serverId) {
  const IP = "127.0.0.1";
  const HOSTNAME = "localhost";

  const server = http.createServer((req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain");
      res.end("Error 400: Bad Request");

      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");

    res.write("I Received: ");

    req.on("data", (chunk) => res.write(chunk));

    req.on("end", () => res.end());
  });

  server.listen(port);

  // add custom props to server object
  server.id = serverId;
  server.hostname = HOSTNAME;
  server.ip = IP;
  server.port = port;

  console.log(
    `Server created - ${HOSTNAME} #${serverId}\n[${IP}:${port}] Listening on port ${port}...\n`
  );

  return server;
}

export default createLocalServer;
