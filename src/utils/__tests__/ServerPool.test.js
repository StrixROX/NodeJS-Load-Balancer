const ServerPool = require("../ServerPool.js");
const createEchoServer = require("../createEchoServer.js");

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

describe("ServerPool", () => {
  it("can add servers to pool", () => {
    expect(serverPool.size).toBe(0);

    serverPool.addServer(s1);

    expect(serverPool.size).toBe(1);
    expect(serverPool.servers[0]).toBe(s1);

    serverPool.addServer(s2);

    expect(serverPool.size).toBe(2);
    expect(serverPool.servers[1]).toBe(s2);

    serverPool.addServer(s3);

    expect(serverPool.size).toBe(3);
    expect(serverPool.servers[2]).toBe(s3);
  });

  it("throws error when adding server with id that already exists in the pool", () => {
    expect(() => serverPool.addServer(s1)).toThrowError(
      "server with same id already exists"
    );
  });

  it("can remove servers from pool", () => {
    expect(serverPool.size).toBe(3);

    serverPool.removeServerById(1);

    expect(serverPool.size).toBe(2);
    expect(serverPool.servers[0]).toBe(s2);
    expect(serverPool.servers[1]).toBe(s3);

    serverPool.removeServerById(2);

    expect(serverPool.size).toBe(1);
    expect(serverPool.servers[0]).toBe(s3);

    serverPool.removeServerById(3);

    expect(serverPool.size).toBe(0);
  });

  it("throws error when removing server with id that does not exist in the pool", () => {
    expect(() => serverPool.removeServerById(4)).toThrowError(
      "server with id 4 does not exist"
    );
  });
});
