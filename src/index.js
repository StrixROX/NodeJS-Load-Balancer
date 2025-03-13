const RoundRobinLoadBalancer = require("./LoadBalancer/variants/RoundRobin.js");
const createEchoServer = require("./utils/createLocalServer.js");
const ServerPool = require("./utils/ServerPool.js");

const pool = new ServerPool();
const POOL_SIZE = 5;

for (let i = 0; i < POOL_SIZE; i++) {
  pool.addServer(
    createEchoServer({
      serverId: i + 1,
      hostname: "localhost",
      ip: "127.0.0.1",
      port: 3000 + i + 1,
    })
  );
}

const loadBalancer = new RoundRobinLoadBalancer(pool, {
  serverId: 0,
  hostname: "localhost",
  ip: "127.0.0.1",
  port: 3000,
});
