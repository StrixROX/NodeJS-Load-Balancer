const ServerPool = require("./utils/ServerPool.js");
const createEchoServer = require("./utils/createEchoServer.js");
const createLoadBalancer = require("./utils/createLoadBalancer.js");
const LoadBalancingAlgorithms = require("./LoadBalancerAlgorithms");

const POOL_SIZE = 3;

// create server pool
const pool = new ServerPool();

// add servers
for (let i = 0; i < POOL_SIZE; i++) {
  const server = createEchoServer({
    serverId: i + 1,
    hostname: "localhost",
    ip: "127.0.0.1",
    port: 3000 + i + 1,
  });
  pool.addServer(server);
}

// choose load balancing algorithm
const loadBalancerAlgorithm =
  // LoadBalancingAlgorithms.RoundRobinLoadBalancer();
  // LoadBalancingAlgorithms.WeightedRoundRobinLoadBalancer([1, 2, 1, 1, 1]);
  LoadBalancingAlgorithms.LeastConnectionLoadBalancer();

// create load balancer
const loadBalancer = createLoadBalancer(
  { serverId: 0, hostname: "localhost", ip: "127.0.0.1", port: 5000 },
  pool,
  loadBalancerAlgorithm
);

// start servers
pool.servers.forEach((server) => server.start());
loadBalancer.start();
