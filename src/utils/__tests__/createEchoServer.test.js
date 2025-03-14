const createEchoServer = require("../createEchoServer.js");

const server = createEchoServer({
  serverId: 1,
  hostname: "localhost",
  ip: "127.0.0.1",
  port: 3000,
});

beforeAll(() => server.start());
afterAll(() => server.close());

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

  it("Throws Error 400 when request method is not POST", () => {
    return new Promise(async (resolve, reject) => {
      await fetch(`http://${server.hostname}:${server.port}`, {
        method: "GET",
      })
        .then((response) => {
          expect(response.status).toBe(400);
          expect(response.statusText).toBe("Bad Request");
        })
        .catch((error) => reject(error));

      await fetch(`http://${server.hostname}:${server.port}`, {
        method: "PUT",
        body: "helloworld",
      })
        .then((response) => {
          expect(response.status).toBe(400);
          expect(response.statusText).toBe("Bad Request");
        })
        .catch((error) => reject(error));

      await fetch(`http://${server.hostname}:${server.port}`, {
        method: "PATCH",
        body: "helloworld",
      })
        .then((response) => {
          expect(response.status).toBe(400);
          expect(response.statusText).toBe("Bad Request");
        })
        .catch((error) => reject(error));

      await fetch(`http://${server.hostname}:${server.port}`, {
        method: "DELETE",
        body: "helloworld",
      })
        .then((response) => {
          expect(response.status).toBe(400);
          expect(response.statusText).toBe("Bad Request");
        })
        .catch((error) => reject(error));

      resolve();
    });
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

        const reader = response.body.getReader();

        const textDecoder = new TextDecoder("UTF-8");

        // next chunks are the data
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
      })
      .then((data) => {
        expect(data).toBe(`[server #${server.id}] I Received: helloworld`);
      });
  });
});
