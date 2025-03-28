import http from 'http';

import type { ServerArgs, ServerInstance } from '../types';

import appAssert from './appAssert';

const DELAY_BEFORE_SENDING_RESPONSE = 0;
const DELAY_BETWEEN_SENDING_EACH_CHUNK = 20;

function createEchoServer(serverArgs: ServerArgs): ServerInstance {
  appAssert(
    serverArgs !== undefined,
    'Failed to create server',
    'serverArgs was not passed\nserverArgs: { id: Number, hostname: String, ip: String, port: Number }'
  );

  const { id: serverId, hostname, ip, port, allowOrigin } = serverArgs;

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
    allowOrigin !== undefined,
    'Failed to create server',
    'allowOrigin is required in serverArgs'
  );

  let connectionCountLocal = 0;

  const server = http.createServer((req, res) => {
    connectionCountLocal++;

    if (req.headers.origin !== allowOrigin) {
      res.statusCode = 403;
      res.setHeader('content-type', 'text/plain');
      res.end('Error 403: Forbidden');
    } else if (req.method === 'POST' && req.url === '/') {
      res.statusCode = 200;
      res.setHeader('content-type', 'text/plain');
      res.setHeader('access-control-allow-origin', allowOrigin);
      res.setHeader('transfer-encoding', 'chunked');

      res.write(`[server #${serverId}] I Received: `);

      let promiseChain = new Promise((resolve) =>
        setTimeout(resolve, DELAY_BEFORE_SENDING_RESPONSE)
      );

      req.on('data', (chunk) => {
        for (const i of chunk) {
          promiseChain = promiseChain.then(() => {
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                res.write(String.fromCharCode(i));
                resolve();
              }, DELAY_BETWEEN_SENDING_EACH_CHUNK);
            });
          });
        }
      });

      req.on('end', () => {
        promiseChain.then(() => res.end(''));
      });
    } else {
      res.statusCode = 400;
      res.setHeader('content-type', 'text/plain');
      res.setHeader('access-control-allow-origin', allowOrigin);
      res.end('Error 400: Bad Request');
    }

    res.on('close', () => {
      connectionCountLocal--;
      req.socket.destroy();
    });
  });

  console.log(
    `\x1b[32m✔\x1b[0m [ OK ] Server created - ${hostname} #${serverId}`
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

export default createEchoServer;
