import http from "http";

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
      if (req.method !== "POST") {
        res.statusCode = 400;
        res.setHeader("Content-Type", "text/plain");
        res.end("Error 400: Bad Request");

        return;
      }

      const targetServer = this._getServer();
      const targetServerAddress =
        targetServer.address().address === "::"
          ? "localhost"
          : targetServer.address().address;
      const targetServerPort = targetServer.address().port;

      res.writeHead(308, {
        location: `http://${targetServerAddress}:${targetServerPort}/`,
      });
      res.end();
    });

    server.listen(this.port);

    console.log(
      `🔺 Load Balancer created - ${this.hostname} #${this.serverId}\n[${this.ip}:${this.port}] Listening on port ${this.port}...\n`
    );

    return server;
  }
}

export default RoundRobinLoadBalancer;
