import http from 'http';

import type {
  LoadBalancerAlgorithm,
  ServerArgs,
  ServerInstance,
  ServerPool,
} from '../types';

import appAssert from './appAssert';

function createLoadBalancer(
  serverArgs: ServerArgs,
  serverPool: ServerPool,
  getNextServerIndex: LoadBalancerAlgorithm
): ServerInstance {
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

  appAssert(
    serverPool !== undefined,
    'Failed to create server',
    'serverPool (ServerPool) was not passed'
  );

  appAssert(
    getNextServerIndex !== undefined,
    'Failed to create server',
    'getNextServerIndex ((serverPool: ServerPool, currentServerIndex: Number) => Number) was not passed'
  );

  let connectionCountLocal = 0;
  let currentServerIndex = -1;

  function getServer(): ServerInstance {
    currentServerIndex = getNextServerIndex(serverPool, currentServerIndex);
    return serverPool.servers[currentServerIndex];
  }

  const server = http.createServer((req, res) => {
    connectionCountLocal++;

    if (req.headers.origin !== allowOrigin) {
      res.statusCode = 403;
      res.setHeader('content-type', 'text/plain');
      res.end('Error 403: Forbidden');
    } else if (req.method === 'POST' && req.url === '/') {
      const serverFromPool = getServer();
      const { hostname: targetHostname, port: targetPort } = serverFromPool;

      const proxyReq = http.request(
        {
          host: targetHostname,
          port: targetPort,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, origin: `http://${hostname}:${port}` },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 500, {
            ...proxyRes.headers,
            'access-control-allow-origin': allowOrigin,
          });
          proxyRes.pipe(res);

          proxyRes.on('end', () => {
            res.end();

            proxyReq.socket?.destroy();
          });
        }
      );

      req.pipe(proxyReq);

      proxyReq.on('error', (error) => {
        console.error(error);

        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.setHeader('access-control-allow-origin', allowOrigin);
        res.end('Error 500: Internal Server Error');
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
    `\x1b[32m✔\x1b[0m [ OK ] Load Balancer created - ${hostname} #${serverId}`
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
        `🔷 [ ${hostname} #${serverId} ] Listening on port ${port}...`
      );
    },

    close: () => {
      console.log(`♦️ [ ${hostname} #${serverId} ] Server closed`);
      server.close();
    },
  };
}

export default createLoadBalancer;
