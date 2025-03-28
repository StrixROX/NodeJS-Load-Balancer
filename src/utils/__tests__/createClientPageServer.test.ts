import fs from 'fs';

import createClientPageServer from '../createClientPageServer';

jest.mock('fs', () => {
  return {
    readFile: jest.fn((filePath, callback) => {
      return callback(null, '');
    }),
  };
});

const clientPageServer = createClientPageServer(
  {
    id: 0,
    hostname: 'localhost',
    ip: '127.0.0.1',
    port: 8080,
  },
  'index.html'
);

beforeAll(() => clientPageServer.start());
afterAll(() => clientPageServer.close());

describe('createClientPageServer', () => {
  it('Throws error when invalid args are passed', () => {
    // @ts-expect-error: serverArgs is intentionally being omitted to test error handling
    expect(() => createClientPageServer()).toThrow('serverArgs was not passed');

    // @ts-expect-error: serverArgs is intentionally left incomplete to test error handling
    expect(() => createClientPageServer({})).toThrow(
      'id is required in serverArgs'
    );

    // @ts-expect-error: serverArgs is intentionally left incomplete to test error handling
    expect(() => createClientPageServer({ id: 0 })).toThrow(
      'hostname is required in serverArgs'
    );

    expect(() =>
      // @ts-expect-error: serverArgs is intentionally left incomplete to test error handling
      createClientPageServer({ id: 1, hostname: 'localhost' })
    ).toThrow('ip is required in serverArgs');

    expect(() =>
      // @ts-expect-error: serverArgs is intentionally left incomplete to test error handling
      createClientPageServer({
        id: 0,
        hostname: 'localhost',
        ip: '127.0.0.1',
      })
    ).toThrow('port is required in serverArgs');

    expect(() =>
      // @ts-expect-error: serverArgs is intentionally left incomplete to test error handling
      createClientPageServer({
        id: 0,
        hostname: 'localhost',
        ip: '127.0.0.1',
        port: 5000,
      })
    ).toThrow('htmlFilePath (string) was not passed');
  });

  it("Returns the server details", async () => {
    expect(clientPageServer.id).toBe(0);
    expect(clientPageServer.hostname).toBe('localhost');
    expect(clientPageServer.ip).toBe('127.0.0.1');
    expect(clientPageServer.port).toBe(8080);
    expect(clientPageServer.allowOrigin).toBe("*");
    expect(clientPageServer.getConnectionsSync()).toBe(0);
    expect(await clientPageServer.getConnections()).toBe(0);
  })

  it('Returns the test webpage when GET request is made to /', () => {
    return fetch(
      `http://${clientPageServer.hostname}:${clientPageServer.port}`
    ).then((response) => {
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/html');

      return response.text();
    });
  });

  it('Throws Error 500 when fs fails to read file while trying GET /', () => {
    // @ts-expect-error: fs.readFile is mocked above
    fs.readFile.mockImplementationOnce((filePath, callback) => {
      callback(new Error(`Failed to read file: ${filePath}`), null);
    });

    return fetch(
      `http://${clientPageServer.hostname}:${clientPageServer.port}`,
      {
        method: 'GET',
        headers: {
          'content-type': 'text/plain',
        },
      }
    )
      .then((response) => {
        expect(response.status).toBe(500);
        expect(response.headers.get('content-type')).toBe('text/plain');

        return response.text();
      })
      .then((data) => {
        expect(data).toBe('Error 500: Internal Server Error');
      });
  });

  it('Throws Error 400 when a non-GET request is made to /', () => {
    return fetch(
      `http://${clientPageServer.hostname}:${clientPageServer.port}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'text/plain',
        },
      }
    )
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
