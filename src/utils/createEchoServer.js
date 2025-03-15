const http = require('http');
const appAssert = require('./appAssert');

const RESPONSE_DELAY = 0;
const RESPONSE_CHUNK_DELAY = 20;

function createEchoServer(serverArgs) {
  appAssert(
    serverArgs !== undefined,
    'Failed to create server',
    'serverArgs was not passed\nserverArgs: { serverId: Number, hostname: String, ip: String, port: Number }'
  );

  const { serverId, hostname, ip, port, allowOrigin } = serverArgs;

  appAssert(
    serverId !== undefined,
    'Failed to create server',
    'serverId is required in serverArgs'
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

  let connectionCount = 0;

  const server = http.createServer((req, res) => {
    connectionCount++;

    if (req.headers.origin !== allowOrigin) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Error 403: Forbidden');
    } else if (req.method === 'POST' && req.url === '/') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('access-control-allow-origin', allowOrigin);
      res.setHeader('Transfer-Encoding', 'chunked');

      res.write(`[server #${serverId}] I Received: `);

      // let promiseChain = Promise.resolve(null);
      let promiseChain = new Promise((resolve) =>
        setTimeout(resolve, RESPONSE_DELAY)
      );

      req.on('data', (chunk) => {
        for (let i of chunk) {
          promiseChain = promiseChain.then(() => {
            return new Promise((resolve) => {
              setTimeout(() => {
                res.write(String.fromCharCode(i));
                resolve();
              }, RESPONSE_CHUNK_DELAY);
            });
          });
        }
      });

      req.on('end', () => {
        promiseChain.then(() => {
          res.end('');
        });
      });
    } else {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('access-control-allow-origin', allowOrigin);
      res.end('Error 400: Bad Request');
    }

    res.on('close', () => {
      connectionCount--;
      req.socket.destroy();
    });
  });

  console.log(
    `\x1b[32m✔\x1b[0m [ OK ] Server created - ${hostname} #${serverId}`
  );

  return {
    id: serverId,
    hostname,
    ip,
    port,
    getConnections: () =>
      new Promise((resolve, reject) => {
        server.getConnections((error, count) => resolve(count));
      }),
    getConnectionsSync: () => connectionCount,
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

module.exports = createEchoServer;
