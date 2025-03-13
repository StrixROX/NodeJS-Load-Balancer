import RoundRobinLoadBalancer from "./LoadBalancer/variants/RoundRobin.js";
import createEchoServer from "./utils/createLocalServer.js";
import ServerPool from "./utils/ServerPool.js";

const pool = new ServerPool();
const POOL_SIZE = 4;

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
