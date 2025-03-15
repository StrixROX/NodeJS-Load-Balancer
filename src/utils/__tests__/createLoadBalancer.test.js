const fs = require("node:fs");

const createLoadBalancer = require("../createLoadBalancer.js");
const createEchoServer = require("../createEchoServer.js");
const ServerPool = require("../ServerPool.js");

jest.mock("node:fs", () => {
  return {
    readFile: jest.fn((filePath, callback) => {
      return callback(null, "");
    }),
  };
});

const serverPool = new ServerPool();
serverPool.addServer(
  createEchoServer({
    serverId: 1,
    hostname: "localhost",
    ip: "127.0.0.1",
    port: 3001,
  })
);

const loadBalancer = createLoadBalancer(
  {
    serverId: 0,
    hostname: "localhost",
    ip: "127.0.0.1",
    port: 5000,
  },
  serverPool,
  () => 0
);

beforeAll(() => {
  serverPool.servers.forEach((server) => server.start());
  loadBalancer.start();
});

afterAll(() => {
  serverPool.servers.forEach((server) => server.close());
  loadBalancer.close();
});

describe("createLoadBalancer", () => {
  it("Throws error when invalid args are passed", () => {
    expect(() => createLoadBalancer()).toThrow("serverArgs was not passed");

    expect(() => createLoadBalancer({})).toThrow(
      "serverId is required in serverArgs"
    );

    expect(() => createLoadBalancer({ serverId: 0 })).toThrow(
      "hostname is required in serverArgs"
    );

    expect(() =>
      createLoadBalancer({ serverId: 1, hostname: "localhost" })
    ).toThrow("ip is required in serverArgs");

    expect(() =>
      createLoadBalancer({
        serverId: 0,
        hostname: "localhost",
        ip: "127.0.0.1",
      })
    ).toThrow("port is required in serverArgs");

    expect(() =>
      createLoadBalancer({
        serverId: 0,
        hostname: "localhost",
        ip: "127.0.0.1",
        port: 5000,
      })
    ).toThrow("serverPool (ServerPool) was not passed");

    expect(() =>
      createLoadBalancer(
        {
          serverId: 0,
          hostname: "localhost",
          ip: "127.0.0.1",
          port: 5000,
        },
        serverPool
      )
    ).toThrow(
      "getNextServerIndex ((serverPool: ServerPool, currentServerIndex: Number) => Number) was not passed"
    );
  });

  it("Returns the test webpage when GET request is made to /", () => {
    return fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}`).then(
      (response) => {
        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("text/html");
      }
    );
  });

  it("Returns Error 400 when anything but GET request is made to /", () => {
    return fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}/server`)
      .then((response) => {
        expect(response.status).toBe(400);
        expect(response.headers.get("Content-Type")).toBe("text/plain");

        return response.text();
      })
      .then((data) => {
        expect(data).toBe("Error 400: Bad Request");
      });
  });

  it("Returns response from server #1 when POST request is made to /server", () => {
    return fetch(
      `http://${loadBalancer.hostname}:${loadBalancer.port}/server`,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: "helloworld",
      }
    )
      .then(async (response) => {
        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("text/plain");

        const textDecoder = new TextDecoder("utf-8");
        const streamReader = response.body.getReader();

        let keepReading = true;
        let data = "";
        while (keepReading) {
          await streamReader.read().then(({ done, value }) => {
            const res = textDecoder.decode(value);
            data += res;
            keepReading = !done;
          });
        }

        return data;
      })
      .then((data) => {
        expect(data).toBe(
          `[server #${serverPool.servers[0].id}] I Received: helloworld`
        );
      });
  });

  it("Throws Error 404 when fs fails to read file while trying GET /", () => {
    fs.readFile.mockImplementationOnce((filePath, callback) => {
      callback(new Error(`Failed to read file: ${filePath}`), null);
    });

    return fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}`, {
      method: "GET",
      headers: {
        "Content-Type": "text/plain",
      },
    })
      .then((response) => {
        expect(response.status).toBe(404);
        expect(response.headers.get("Content-Type")).toBe("text/plain");

        return response.text();
      })
      .then((data) => {
        expect(data).toBe("Error 404: Not Found");
      });
  });

  it("Throws Error 500 when load balancer cannot reach any server for response", () => {
    serverPool.servers.forEach((server) => server.close());

    return fetch(
      `http://${loadBalancer.hostname}:${loadBalancer.port}/server`,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: "helloworld",
      }
    )
      .then((response) => {
        expect(response.status).toBe(500);
        expect(response.headers.get("Content-Type")).toBe("text/plain");

        return response.text();
      })
      .then((data) => {
        expect(data).toBe("Error 500: Internal Server Error");
      });
  });
});
