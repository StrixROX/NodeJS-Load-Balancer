const createEchoServer = require("../createEchoServer.js");

const server = createEchoServer({
  serverId: 1,
  hostname: "localhost",
  ip: "127.0.0.1",
  port: 3000,
});

beforeAll(() => server.start());
afterAll(() => server.close());

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
    expect(server.getConnectionsSync()).toBe(0);

    await fetch(`http://${server.hostname}:${server.port}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: "helloworldahdasasdhjdasjdajadsajdashjasdhdashjashkasdhashasdhjsadh",
    })
      .then(async (response) => {
        expect(server.getConnectionsSync()).toBe(1);

        return await readResponseToEnd(response);
      })
      .then(() => {
        expect(server.getConnectionsSync()).toBe(0);
      });
  });

  it("Throws Error 400 when request method is not POST", (done) => {
    const promiseArr = [];

    for (let i of ["GET", "PUT", "PATCH", "DELETE"]) {
      promiseArr.push(
        fetch(`http://${server.hostname}:${server.port}`, {
          method: i,
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
});
