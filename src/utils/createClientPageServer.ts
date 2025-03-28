import fs from 'fs';
import http from 'http';

import type { ServerArgs, ServerInstance } from '../types';

import appAssert from './appAssert';

function createClientPageServer(
  serverArgs: Omit<ServerArgs, 'allowOrigin'>,
  htmlFilePath: string
): ServerInstance {
  appAssert(
    serverArgs !== undefined,
    'Failed to create server',
    'serverArgs was not passed\nserverArgs: { id: Number, hostname: String, ip: String, port: Number }'
  );

  const { id: serverId, hostname, ip, port } = serverArgs;

  appAssert(
    serverId !== undefined,
    'Failed to create server',
    'id is required in serverArgs'
  );
  appAssert(
    hostname !== undefined,
    'Failed to create server',
    'hostname is required in serverArgs'
  );
  appAssert(
    ip !== undefined,
    'Failed to create server',
    'ip is required in serverArgs'
  );
  appAssert(
    port !== undefined,
    'Failed to create server',
    'port is required in serverArgs'
  );

  appAssert(
    htmlFilePath !== undefined,
    'Failed to create client page server',
    'htmlFilePath (string) was not passed'
  );

  const allowOrigin = '*';
  let connectionCountLocal = 0;

  const server = http.createServer((req, res) => {
    connectionCountLocal++;

    if (req.method === 'GET' && req.url === '/') {
      fs.readFile(htmlFilePath, (error, data) => {
        if (error) {
          console.error(error);
          res.statusCode = 500;
          res.setHeader('content-type', 'text/plain');
          res.end('Error 500: Internal Server Error');
        } else {
          res.statusCode = 200;
          res.setHeader('content-type', 'text/html');
          res.end(data);
        }
      });
    } else {
      res.statusCode = 400;
      res.setHeader('content-type', 'text/plain');
      res.end('Error 400: Bad Request');
    }

    res.on('close', () => {
      connectionCountLocal--;
      req.socket.destroy();
    });
  });

  console.log(
    `\x1b[32m✔\x1b[0m [ OK ] Client Page Server created - ${hostname} #${serverId}`
  );

  return {
    get id() {
      return serverId;
    },

    get hostname() {
      return hostname;
    },

    get ip() {
      return ip;
    },

    get port() {
      return port;
    },

    get allowOrigin() {
      return allowOrigin;
    },

    getConnections: () =>
      new Promise((resolve) => {
        server.getConnections((error, count) => resolve(count));
      }),

    getConnectionsSync: () => connectionCountLocal,

    start: () => {
      server.listen(port);
      console.log(
        `🟢 [ ${hostname} #${serverId} ] Listening on port ${port}...`
      );
    },

    close: () => {
      server.close();
      console.log(`🔴 [ ${hostname} #${serverId} ] Server closed`);
    },
  };
}

export default createClientPageServer;
