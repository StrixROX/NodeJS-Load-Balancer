const LoadBalancerAlgorithms = require("../index.js");
const ServerPool = require("../../utils/ServerPool.js");
const createEchoServer = require("../../utils/createEchoServer.js");
const createLoadBalancer = require("../../utils/createLoadBalancer.js");

const HUNDRED_CHARS =
  "arnmodwpbcfnpkkdghtikbneqyxuzhcdlfcpijdeldiytmnwclqawndxievhorlyxdrajuqesutwrlgdcstgmekifiurxpdxdaol";

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

const readResponseToEnd = async (response) => {
  const textDecoder = new TextDecoder("utf-8");
  const streamReader = response.body.getReader();

  let data = "";
  let keepReading = true;
  while (keepReading) {
    await streamReader.read().then(({ done, value }) => {
      data += textDecoder.decode(value);
      keepReading = !done;
    });
  }

  return data;
};

describe("Load Balancing Algorithms - RoundRobin", () => {
  it("cycles through all the servers in the pool", () => {
    const roundRobin = LoadBalancerAlgorithms.RoundRobinLoadBalancer();

    expect(roundRobin(serverPool, 0)).toBe(1);
    expect(roundRobin(serverPool, 1)).toBe(2);
    expect(roundRobin(serverPool, 2)).toBe(0);
  });
});

describe("Load Balancing Algorithms - WeightedRoundRobin", () => {
  it("functions same as RoundRobin when all servers have the same weight", () => {
    const weightedRoundRobin =
      LoadBalancerAlgorithms.WeightedRoundRobinLoadBalancer(
        serverPool.servers.map(() => 1)
      );

    const roundRobin = LoadBalancerAlgorithms.RoundRobinLoadBalancer();

    expect(weightedRoundRobin(serverPool, 0)).toBe(roundRobin(serverPool, 0));
    expect(weightedRoundRobin(serverPool, 1)).toBe(roundRobin(serverPool, 1));
    expect(weightedRoundRobin(serverPool, 2)).toBe(roundRobin(serverPool, 2));
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

describe("Load Balancing Algorithms - LeastConnection", () => {
  const loadBalancer = createLoadBalancer(
    {
      serverId: 0,
      hostname: "localhost",
      ip: "127.0.0.1",
      port: 5000,
    },
    serverPool,
    LoadBalancerAlgorithms.LeastConnectionLoadBalancer()
  );

  beforeAll(() => {
    serverPool.servers.forEach((server) => server.start());
    loadBalancer.start();
  });
  afterAll(() => {
    serverPool.servers.forEach((server) => server.close());
    loadBalancer.close();
  });

  it("functions same as RoundRobin when all servers have the same number of connections", (done) => {
    const roundRobin = LoadBalancerAlgorithms.RoundRobinLoadBalancer();

    const promiseArr = [];

    for (let i = 0; i < 5; i++) {
      const nextRoundRobinServerId = roundRobin(serverPool, i) + 1;

      promiseArr.push(
        fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}/server`, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },
          body: HUNDRED_CHARS,
        })
          .then(readResponseToEnd)
          .then((data) => {
            expect(data).toBe(
              `[server #${nextRoundRobinServerId}] I Received: ${HUNDRED_CHARS}`
            );
          })
      );
    }

    Promise.allSettled(promiseArr).then(() => done());
  });

  it("sends requests to the server with lowest number of connections", () => {
    const leastConnection =
      LoadBalancerAlgorithms.LeastConnectionLoadBalancer();

    let mockServerPool;

    mockServerPool = {
      servers: [
        { id: 1, getConnectionCount: () => 2 },
        { id: 2, getConnectionCount: () => 1 },
        { id: 3, getConnectionCount: () => 3 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(1);

    mockServerPool = {
      servers: [
        { id: 1, getConnectionCount: () => 1 },
        { id: 2, getConnectionCount: () => 1 },
        { id: 3, getConnectionCount: () => 3 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(0);

    mockServerPool = {
      servers: [
        { id: 1, getConnectionCount: () => 1 },
        { id: 2, getConnectionCount: () => 2 },
        { id: 3, getConnectionCount: () => 3 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(0);

    mockServerPool = {
      servers: [
        { id: 1, getConnectionCount: () => 3 },
        { id: 2, getConnectionCount: () => 2 },
        { id: 3, getConnectionCount: () => 1 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(2);
  });
  //   fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}/server`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "text/plain",
  //     },
  //     body: HUNDRED_CHARS + HUNDRED_CHARS,
  //   })
  //     .then((response) => readResponseToEnd(response, true))
  //     .then((data) => {
  //       expect(data).toBe(
  //         `[server #1] I Received: ${HUNDRED_CHARS + HUNDRED_CHARS}`
  //       );
  //     }); // ~6s

  //   setTimeout(
  //     () =>
  //       fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}/server`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "text/plain",
  //         },
  //         body: HUNDRED_CHARS + FIFTY_CHARS,
  //       })
  //         .then((response) => readResponseToEnd(response, true))
  //         .then((data) => {
  //           expect(data).toBe(
  //             `[server #1] I Received: ${HUNDRED_CHARS + FIFTY_CHARS}`
  //           );

  //           done();
  //         }), // ~4.5s
  //     500
  //   );

  //   // const promiseArr = [];

  //   // const initiateRequestGen =
  //   //   (expectedServerId, onConnectCallback, payload = HUNDRED_CHARS) =>
  //   //   () =>
  //   //     fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}/server`, {
  //   //       method: "POST",
  //   //       headers: {
  //   //         "Content-Type": "text/plain",
  //   //       },
  //   //       body: payload,
  //   //     })
  //   //       .then(async (response) => {
  //   //         await new Promise((resolve) => setTimeout(resolve, 1000));
  //   //         onConnectCallback();
  //   //         return await readResponseToEnd(response, true);
  //   //       })
  //   //       .then((data) => {
  //   //         expect(data).toBe(
  //   //           `[server #${expectedServerId}] I Received: ${payload}`
  //   //         );
  //   //       });

  //   // const req3 = initiateRequestGen(
  //   //   "3",
  //   //   () => done(),
  //   //   HUNDRED_CHARS + FIFTY_CHARS
  //   // );
  //   // const req2 = initiateRequestGen("2", req3, HUNDRED_CHARS + FIFTY_CHARS);
  //   // const req1 = initiateRequestGen("1", req2, HUNDRED_CHARS + HUNDRED_CHARS);

  //   // req1();

  //   // promiseArr.push(
  //   //   fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}/server`, {
  //   //     method: "POST",
  //   //     headers: {
  //   //       "Content-Type": "text/plain",
  //   //     },
  //   //     body: HUNDRED_CHARS + HUNDRED_CHARS,
  //   //   })
  //   //     .then((response) => readResponseToEnd(response, true))
  //   //     .then((data) => {
  //   //       expect(data).toBe(
  //   //         `[server #1] I Received: ${HUNDRED_CHARS + HUNDRED_CHARS}`
  //   //       );
  //   //     })
  //   // ); // ~6s

  //   // promiseArr.push(
  //   //   fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}/server`, {
  //   //     method: "POST",
  //   //     headers: {
  //   //       "Content-Type": "text/plain",
  //   //     },
  //   //     body: HUNDRED_CHARS + FIFTY_CHARS,
  //   //   })
  //   //     .then((response) => readResponseToEnd(response, true))
  //   //     .then((data) => {
  //   //       expect(data).toBe(
  //   //         `[server #2] I Received: ${HUNDRED_CHARS + FIFTY_CHARS}`
  //   //       );
  //   //     })
  //   // ); // ~4.5s

  //   // promiseArr.push(
  //   //   fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}/server`, {
  //   //     method: "POST",
  //   //     headers: {
  //   //       "Content-Type": "text/plain",
  //   //     },
  //   //     body: HUNDRED_CHARS,
  //   //   })
  //   //     .then((response) => readResponseToEnd(response, true))
  //   //     .then((data) => {
  //   //       expect(data).toBe(`[server #3] I Received: ${HUNDRED_CHARS}`);
  //   //     })
  //   // ); // ~3s

  //   // promiseArr.push(
  //   //   fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}/server`, {
  //   //     method: "POST",
  //   //     headers: {
  //   //       "Content-Type": "text/plain",
  //   //     },
  //   //     body: FIFTY_CHARS,
  //   //   })
  //   //     .then((response) => readResponseToEnd(response, true))
  //   //     .then((data) => {
  //   //       expect(data).toBe(`[server #1] I Received: ${FIFTY_CHARS}`);
  //   //     })
  //   // ); // 1.5s

  //   // Promise.allSettled(promiseArr).then(() => done());
  // }, 10000);
});
