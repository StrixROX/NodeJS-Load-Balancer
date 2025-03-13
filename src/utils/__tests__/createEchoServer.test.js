const createEchoServer = require("../createEchoServer.js");

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

  const server = createEchoServer({
    serverId: 1,
    hostname: "localhost",
    ip: "127.0.0.1",
    port: 3000,
  });

  server.start();

  it("Throws Error 400 when request method is not POST", async () => {
    await fetch(`http://${server.hostname}:${server.port}`, {
      method: "GET",
    }).then((response) => {
      expect(response.status).toBe(400);
      expect(response.statusText).toBe("Bad Request");
    });

    await fetch(`http://${server.hostname}:${server.port}`, {
      method: "PUT",
      body: "helloworld",
    }).then((response) => {
      expect(response.status).toBe(400);
      expect(response.statusText).toBe("Bad Request");
    });

    await fetch(`http://${server.hostname}:${server.port}`, {
      method: "PATCH",
      body: "helloworld",
    }).then((response) => {
      expect(response.status).toBe(400);
      expect(response.statusText).toBe("Bad Request");
    });

    await fetch(`http://${server.hostname}:${server.port}`, {
      method: "DELETE",
      body: "helloworld",
    }).then((response) => {
      expect(response.status).toBe(400);
      expect(response.statusText).toBe("Bad Request");
    });
  });

  it("Streams data back to client", async () => {
    await fetch(`http://${server.hostname}:${server.port}`, {
      method: "POST",
      body: "helloworld",
    }).then(async (response) => {
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/plain");
      expect(response.headers.get("Transfer-Encoding")).toBe("chunked");

      const reader = response.body.getReader();

      expect(reader).not.toBeNull();

      const textDecoder = new TextDecoder("UTF-8");

      // first chunk is server info
      await reader.read().then(({ value }) => {
        const res = textDecoder.decode(value);
        expect(res).toBe(`[server #${server.id}] I Received: `);
      });

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
      expect(data).toBe("helloworld");
    });

    // close the server at the end of the test
    server.close();
  });
});
