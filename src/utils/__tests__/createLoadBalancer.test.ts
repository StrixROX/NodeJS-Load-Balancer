import createEchoServer from '../createEchoServer';
import createLoadBalancer from '../createLoadBalancer';
import createServerPool from '../createServerPool';

const serverPool = createServerPool();
serverPool.addServer(
  createEchoServer({
    id: 1,
    hostname: 'localhost',
    ip: '127.0.0.1',
    port: 3001,
    allowOrigin: 'http://localhost:5000',
  })
);

const loadBalancer = createLoadBalancer(
  {
    id: 0,
    hostname: 'localhost',
    ip: '127.0.0.1',
    port: 5000,
    allowOrigin: 'http://localhost:8080',
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

describe('createLoadBalancer', () => {
  it('Throws error when invalid args are passed', () => {
    // @ts-expect-error: serverArgs is intentionally being omitted to test error handling
    expect(() => createLoadBalancer()).toThrow('serverArgs was not passed');

    // @ts-expect-error: serverArgs is intentionally left incomplete to test error handling
    expect(() => createLoadBalancer({})).toThrow(
      'id is required in serverArgs'
    );

    // @ts-expect-error: serverArgs is intentionally left incomplete to test error handling
    expect(() => createLoadBalancer({ id: 0 })).toThrow(
      'hostname is required in serverArgs'
    );

    // @ts-expect-error: serverArgs is intentionally left incomplete to test error handling
    expect(() => createLoadBalancer({ id: 1, hostname: 'localhost' })).toThrow(
      'ip is required in serverArgs'
    );

    expect(() =>
      // @ts-expect-error: serverArgs is intentionally left incomplete to test error handling
      createLoadBalancer({
        id: 0,
        hostname: 'localhost',
        ip: '127.0.0.1',
      })
    ).toThrow('port is required in serverArgs');

    expect(() =>
      // @ts-expect-error: serverArgs is intentionally left incomplete to test error handling
      createLoadBalancer({
        id: 0,
        hostname: 'localhost',
        ip: '127.0.0.1',
        port: 5000,
      })
    ).toThrow('allowOrigin is required in serverArgs');

    expect(() =>
      // @ts-expect-error: serverPoll is intentionally being omitted to test error handling
      createLoadBalancer({
        id: 0,
        hostname: 'localhost',
        ip: '127.0.0.1',
        port: 5000,
        allowOrigin: 'http://localhost:8080',
      })
    ).toThrow('serverPool (ServerPool) was not passed');

    expect(() =>
      // @ts-expect-error: getNextServerIndex is intentionally being omitted to test error handling
      createLoadBalancer(
        {
          id: 0,
          hostname: 'localhost',
          ip: '127.0.0.1',
          port: 5000,
          allowOrigin: 'http://localhost:8080',
        },
        serverPool
      )
    ).toThrow(
      'getNextServerIndex ((serverPool: ServerPool, currentServerIndex: Number) => Number) was not passed'
    );
  });

  it("Returns the server details", async () => {
    expect(loadBalancer.id).toBe(0);
    expect(loadBalancer.hostname).toBe('localhost');
    expect(loadBalancer.ip).toBe('127.0.0.1');
    expect(loadBalancer.port).toBe(5000);
    expect(loadBalancer.allowOrigin).toBe("http://localhost:8080");
    expect(loadBalancer.getConnectionsSync()).toBe(0);
    expect(await loadBalancer.getConnections()).toBe(0);
  })

  it('Returns response from server #1 when POST request is made to /', () => {
    return fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}/`, {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        origin: 'http://localhost:8080',
      },
      body: 'helloworld',
    })
      .then(async (response) => {
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/plain');

        const textDecoder = new TextDecoder('utf-8');
        const streamReader = response.body?.getReader();

        let keepReading = true;
        let data = '';
        while (keepReading) {
          await streamReader?.read().then(({ done, value }) => {
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

  it('Throws Error 500 when load balancer cannot reach any server for response', () => {
    serverPool.servers.forEach((server) => server.close());

    return fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}`, {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        origin: 'http://localhost:8080',
      },
      body: 'helloworld',
    })
      .then((response) => {
        expect(response.status).toBe(500);
        expect(response.headers.get('content-type')).toBe('text/plain');

        return response.text();
      })
      .then((data) => {
        expect(data).toBe('Error 500: Internal Server Error');
      });
  });

  it('Throws Error 403 when origin is not allowed', () => {
    return fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}`, {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        origin: 'http://localhost:8081',
      },
      body: 'helloworld',
    })
      .then((response) => {
        expect(response.status).toBe(403);
        expect(response.headers.get('content-type')).toBe('text/plain');

        return response.text();
      })
      .then((data) => {
        expect(data).toBe('Error 403: Forbidden');
      });
  });

  it('Throws Error 400 when a non-POST request is made to /', () => {
    return fetch(`http://${loadBalancer.hostname}:${loadBalancer.port}`, {
      method: 'GET',
      headers: {
        'content-type': 'text/plain',
        origin: 'http://localhost:8080',
      },
    })
      .then((response) => {
        expect(response.status).toBe(400);
        expect(response.headers.get('content-type')).toBe('text/plain');

        return response.text();
      })
      .then((data) => {
        expect(data).toBe('Error 400: Bad Request');
      });
  });
});
