const LoadBalancerAlgorithms = require("../index.js");
const ServerPool = require("../../utils/ServerPool.js");
const createEchoServer = require("../../utils/createEchoServer.js");

const serverPool = new ServerPool();

const s1 = createEchoServer({
  serverId: 1,
  hostname: "localhost",
  ip: "127.0.0.1",
  port: 3000,
});
const s2 = createEchoServer({
  serverId: 2,
  hostname: "localhost",
  ip: "127.0.0.1",
  port: 3001,
});
const s3 = createEchoServer({
  serverId: 3,
  hostname: "localhost",
  ip: "127.0.0.1",
  port: 3002,
});

serverPool.addServer(s1);
serverPool.addServer(s2);
serverPool.addServer(s3);

describe("Load Balancing Algorithms - RoundRobin", () => {
  it("cycles through all the servers in the pool", () => {
    const roundRobin = LoadBalancerAlgorithms.RoundRobinLoadBalancer();

    expect(roundRobin(serverPool, 0)).toBe(1);
    expect(roundRobin(serverPool, 1)).toBe(2);
    expect(roundRobin(serverPool, 2)).toBe(0);
  });
});

describe("Load Balancing Algorithms - WeightedRoundRobin", () => {
  it("cycles through all the servers in the pool when all servers have the same weight", () => {
    const weightedRoundRobin =
      LoadBalancerAlgorithms.WeightedRoundRobinLoadBalancer(
        serverPool.servers.map(() => 1)
      );

    expect(weightedRoundRobin(serverPool, 0)).toBe(1);
    expect(weightedRoundRobin(serverPool, 1)).toBe(2);
    expect(weightedRoundRobin(serverPool, 2)).toBe(0);
  });

  it("sends more requests to servers with higher weights", () => {
    const weightedRoundRobin =
      LoadBalancerAlgorithms.WeightedRoundRobinLoadBalancer([1, 2, 3]);

    expect(weightedRoundRobin(serverPool, 0)).toBe(1);
    expect(weightedRoundRobin(serverPool, 1)).toBe(1);
    expect(weightedRoundRobin(serverPool, 1)).toBe(2);
    expect(weightedRoundRobin(serverPool, 2)).toBe(2);
    expect(weightedRoundRobin(serverPool, 2)).toBe(2);
    expect(weightedRoundRobin(serverPool, 2)).toBe(0);
  });
});
