const fs = require('fs');
const createClientPageServer = require('../createClientPageServer.js');

jest.mock('fs', () => {
  return {
    readFile: jest.fn((filePath, callback) => {
      return callback(null, '');
    }),
  };
});

const clientPageServer = createClientPageServer(
  {
    serverId: 0,
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
    expect(() => createClientPageServer()).toThrow('serverArgs was not passed');

    expect(() => createClientPageServer({})).toThrow(
      'serverId is required in serverArgs'
    );

    expect(() => createClientPageServer({ serverId: 0 })).toThrow(
      'hostname is required in serverArgs'
    );

    expect(() =>
      createClientPageServer({ serverId: 1, hostname: 'localhost' })
    ).toThrow('ip is required in serverArgs');

    expect(() =>
      createClientPageServer({
        serverId: 0,
        hostname: 'localhost',
        ip: '127.0.0.1',
      })
    ).toThrow('port is required in serverArgs');

    expect(() =>
      createClientPageServer({
        serverId: 0,
        hostname: 'localhost',
        ip: '127.0.0.1',
        port: 5000,
      })
    ).toThrow('htmlFilePath (string) was not passed');
  });

  it('Returns the test webpage when GET request is made to /', () => {
    return fetch(
      `http://${clientPageServer.hostname}:${clientPageServer.port}`
    ).then((response) => {
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');

      return response.text();
    });
  });

  it('Throws Error 404 when fs fails to read file while trying GET /', () => {
    fs.readFile.mockImplementationOnce((filePath, callback) => {
      callback(new Error(`Failed to read file: ${filePath}`), null);
    });

    return fetch(
      `http://${clientPageServer.hostname}:${clientPageServer.port}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain',
        },
      }
    )
      .then((response) => {
        expect(response.status).toBe(404);
        expect(response.headers.get('Content-Type')).toBe('text/plain');

        return response.text();
      })
      .then((data) => {
        expect(data).toBe('Error 404: Not Found');
      });
  });

  it('Throws Error 400 when a non-GET request is made to /', () => {
    return fetch(
      `http://${clientPageServer.hostname}:${clientPageServer.port}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
      }
    )
      .then((response) => {
        expect(response.status).toBe(400);
        expect(response.headers.get('Content-Type')).toBe('text/plain');

        return response.text();
      })
      .then((data) => {
        expect(data).toBe('Error 400: Bad Request');
      });
  });
});
