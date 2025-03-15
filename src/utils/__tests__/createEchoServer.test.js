const createEchoServer = require("../createEchoServer.js");

const server = createEchoServer({
  serverId: 1,
  hostname: "localhost",
  ip: "127.0.0.1",
  port: 3000,
  allowOrigin: "http://localhost:5000",
});

const server2 = createEchoServer({
  serverId: 2,
  hostname: "localhost",
  ip: "127.0.0.1",
  port: 3001,
  allowOrigin: "http://localhost:5000",
});

beforeAll(() => {
  server.start();
  server2.start();
});
afterAll(() => {
  server.close();
  server2.close();
});

const readResponseToEnd = async (response) => {
  const reader = response.body.getReader();

  const textDecoder = new TextDecoder("utf-8");

  let data = "";
  let keepReading = true;
  while (keepReading) {
    await reader.read().then(({ done, value }) => {
      const res = textDecoder.decode(value);
      data += res;
      keepReading = !done;
    });
  }

  return data;
};

describe("createEchoServer", () => {
  it("Throws error when invalid args are passed", () => {
    expect(() => createEchoServer()).toThrow("serverArgs was not passed");

    expect(() => createEchoServer({})).toThrow("serverId is required");

    expect(() => createEchoServer({ serverId: 1 })).toThrow(
      "hostname is required"
    );

    expect(() =>
      createEchoServer({ serverId: 1, hostname: "localhost" })
    ).toThrow("ip is required");

    expect(() =>
      createEchoServer({ serverId: 1, hostname: "localhost", ip: "127.0.0.1" })
    ).toThrow("port is required");
  });

  it("Correctly gives connection count", async () => {
    expect(server2.getConnectionsSync()).toBe(0);
    expect(await server2.getConnections()).toBe(0);

    await fetch(`http://${server2.hostname}:${server2.port}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        origin: "http://localhost:5000",
      },
      body: "helloworldahdasasdhjdasjdajadsajdashjasdhdashjashkasdhashasdhjsadh",
    })
      .then(async (response) => {
        expect(server2.getConnectionsSync()).toBe(1);
        expect(await server2.getConnections()).toBe(1);

        return await readResponseToEnd(response);
      })
      .then(async () => {
        expect(server2.getConnectionsSync()).toBe(0);
        expect(await server2.getConnections()).toBe(0);
      });

    expect(server2.getConnectionsSync()).toBe(0);
    expect(await server2.getConnections()).toBe(0);
  });

  it("Throws Error 400 when request method is not POST", (done) => {
    const promiseArr = [];

    for (let i of ["GET", "PUT", "PATCH", "DELETE"]) {
      promiseArr.push(
        fetch(`http://${server.hostname}:${server.port}`, {
          method: i,
          headers: {
            origin: "http://localhost:5000",
          },
        })
          .then(async (response) => {
            expect(response.status).toBe(400);
            expect(response.statusText).toBe("Bad Request");

            return await readResponseToEnd(response);
          })
          .then((data) => {
            expect(data).toBe("Error 400: Bad Request");
          })
      );
    }

    Promise.all(promiseArr).then(() => done());
  });

  it("Streams data back to client", () => {
    return fetch(`http://${server.hostname}:${server.port}`, {
      method: "POST",
      headers: {
        origin: "http://localhost:5000",
      },
      body: "helloworld",
    })
      .then(async (response) => {
        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("text/plain");
        expect(response.headers.get("Transfer-Encoding")).toBe("chunked");

        return await readResponseToEnd(response);
      })
      .then((data) => {
        expect(data).toBe(`[server #${server.id}] I Received: helloworld`);
      });
  });

  it("Throws Error 403 when origin is not allowed", () => {
    return fetch(`http://${server.hostname}:${server.port}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        origin: "http://localhost:5001",
      },
      body: "helloworld",
    }).then(async (response) => {
      expect(response.status).toBe(403);
      expect(response.headers.get("Content-Type")).toBe("text/plain");
      expect(response.statusText).toBe("Forbidden");

      return await readResponseToEnd(response);
    });
  });
});
