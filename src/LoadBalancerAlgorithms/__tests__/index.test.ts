const LoadBalancerAlgorithms = require('../index.js');

describe('Load Balancing Algorithms - RoundRobin', () => {
  it('cycles through all the servers in the pool', () => {
    const roundRobin = LoadBalancerAlgorithms.RoundRobinLoadBalancer();

    const mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 2 },
        { id: 2, getConnectionsSync: () => 1 },
        { id: 3, getConnectionsSync: () => 3 },
      ],
      size: 3,
    };

    expect(roundRobin(mockServerPool, 0)).toBe(1);
    expect(roundRobin(mockServerPool, 1)).toBe(2);
    expect(roundRobin(mockServerPool, 2)).toBe(0);
  });
});

describe('Load Balancing Algorithms - WeightedRoundRobin', () => {
  it('functions same as RoundRobin when all servers have the same weight', () => {
    const mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 0 },
        { id: 2, getConnectionsSync: () => 0 },
        { id: 3, getConnectionsSync: () => 0 },
      ],
      size: 3,
    };

    const weightedRoundRobin =
      LoadBalancerAlgorithms.WeightedRoundRobinLoadBalancer(
        mockServerPool.servers.map(() => 1)
      );

    const roundRobin = LoadBalancerAlgorithms.RoundRobinLoadBalancer();

    expect(weightedRoundRobin(mockServerPool, 0)).toBe(
      roundRobin(mockServerPool, 0)
    );
    expect(weightedRoundRobin(mockServerPool, 1)).toBe(
      roundRobin(mockServerPool, 1)
    );
    expect(weightedRoundRobin(mockServerPool, 2)).toBe(
      roundRobin(mockServerPool, 2)
    );
  });

  it('sends more requests to servers with higher weights', () => {
    const mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 0 },
        { id: 2, getConnectionsSync: () => 0 },
        { id: 3, getConnectionsSync: () => 0 },
      ],
      size: 3,
    };

    const weightedRoundRobin =
      LoadBalancerAlgorithms.WeightedRoundRobinLoadBalancer([1, 2, 3]);

    expect(weightedRoundRobin(mockServerPool, 0)).toBe(1);
    expect(weightedRoundRobin(mockServerPool, 1)).toBe(1);
    expect(weightedRoundRobin(mockServerPool, 1)).toBe(2);
    expect(weightedRoundRobin(mockServerPool, 2)).toBe(2);
    expect(weightedRoundRobin(mockServerPool, 2)).toBe(2);
    expect(weightedRoundRobin(mockServerPool, 2)).toBe(0);
  });
});

describe('Load Balancing Algorithms - LeastConnection', () => {
  it('functions same as RoundRobin when all servers have the same number of connections', () => {
    const roundRobin = LoadBalancerAlgorithms.RoundRobinLoadBalancer();

    const leastConnection =
      LoadBalancerAlgorithms.LeastConnectionLoadBalancer();

    let mockServerPool;

    mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 0 },
        { id: 2, getConnectionsSync: () => 0 },
        { id: 3, getConnectionsSync: () => 0 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(
      roundRobin(mockServerPool, -1)
    );

    mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 1 },
        { id: 2, getConnectionsSync: () => 0 },
        { id: 3, getConnectionsSync: () => 0 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(roundRobin(mockServerPool, 0));

    mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 1 },
        { id: 2, getConnectionsSync: () => 1 },
        { id: 3, getConnectionsSync: () => 0 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(roundRobin(mockServerPool, 1));

    mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 1 },
        { id: 2, getConnectionsSync: () => 1 },
        { id: 3, getConnectionsSync: () => 1 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(roundRobin(mockServerPool, 2));
  });

  it('sends requests to the server with lowest number of connections', () => {
    const leastConnection =
      LoadBalancerAlgorithms.LeastConnectionLoadBalancer();

    let mockServerPool;

    mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 1 },
        { id: 2, getConnectionsSync: () => 1 },
        { id: 3, getConnectionsSync: () => 2 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(0);

    mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 1 },
        { id: 2, getConnectionsSync: () => 2 },
        { id: 3, getConnectionsSync: () => 1 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(0);

    mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 1 },
        { id: 2, getConnectionsSync: () => 2 },
        { id: 3, getConnectionsSync: () => 2 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(0);

    mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 2 },
        { id: 2, getConnectionsSync: () => 1 },
        { id: 3, getConnectionsSync: () => 1 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(1);

    mockServerPool = {
      servers: [
        { id: 1, getConnectionsSync: () => 2 },
        { id: 2, getConnectionsSync: () => 2 },
        { id: 3, getConnectionsSync: () => 1 },
      ],
      size: 3,
    };
    expect(leastConnection(mockServerPool)).toBe(2);
  });
});
