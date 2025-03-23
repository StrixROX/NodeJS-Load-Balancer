const path = require('path');
const ServerPool = require('./utils/ServerPool.js');
const createEchoServer = require('./utils/createEchoServer.js');
const createLoadBalancer = require('./utils/createLoadBalancer.js');
const LoadBalancingAlgorithms = require('./LoadBalancerAlgorithms');
const createClientPageServer = require('./utils/createClientPageServer.js');

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------
const SERVER_POOL_SIZE = 3;

const CLIENT_PAGE_SERVER_DETAILS = {
  serverId: 'ClientPageServer',
  hostname: 'localhost',
  ip: '127.0.0.1',
  port: 8080,
  allowOrigin: null,
};

const LOAD_BALANCER_SERVER_DETAILS = {
  serverId: 'LoadBalancer',
  hostname: 'localhost',
  ip: '127.0.0.1',
  port: 5000,
  allowOrigin: `http://${CLIENT_PAGE_SERVER_DETAILS.hostname}:${CLIENT_PAGE_SERVER_DETAILS.port}`, // client page server address
};

const DEFAULT_BACKEND_SERVER_DETAILS = {
  hostname: 'localhost',
  ip: '127.0.0.1',
  allowOrigin: `http://${LOAD_BALANCER_SERVER_DETAILS.hostname}:${LOAD_BALANCER_SERVER_DETAILS.port}`, // load balancer server address
};
// ----------------------------------------------------------------------------

// create server pool
const pool = new ServerPool();

// add servers
for (let i = 0; i < SERVER_POOL_SIZE; i++) {
  const server = createEchoServer({
    ...DEFAULT_BACKEND_SERVER_DETAILS,
    serverId: i + 1,
    port: 3000 + i + 1,
  });
  pool.addServer(server);
}

// choose one of the available load balancing algorithms
const loadBalancerAlgorithm =
  // LoadBalancingAlgorithms.RoundRobinLoadBalancer();
  // LoadBalancingAlgorithms.WeightedRoundRobinLoadBalancer([1, 2, 1, 1, 1]);
  LoadBalancingAlgorithms.LeastConnectionLoadBalancer();

// create load balancer
const loadBalancer = createLoadBalancer(
  LOAD_BALANCER_SERVER_DETAILS,
  pool,
  loadBalancerAlgorithm
);

// create client page server
const clientPageServer = createClientPageServer(
  CLIENT_PAGE_SERVER_DETAILS,
  path.join(__dirname, '../public/index.html')
);

// start servers
pool.servers.forEach((server) => server.start());
loadBalancer.start();
clientPageServer.start();
