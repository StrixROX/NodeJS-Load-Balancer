// NetMon - Network Monitor

import crypto from 'crypto';
import EventEmitter from 'events';
import http from 'http';

import { ServerArgsSchema } from '../schema';
import type { ServerArgs, ServerInstance, ServerPool } from '../types';

import errorBoundary from './errorBoundary';
import { EVENT_TYPES, parseEventToString } from './events';
import { createUnmaskedWebSocketFrame } from './websocketFrames';

function createNetMonServer(
  serverArgs: ServerArgs,
  serverPool: ServerPool
): ServerInstance {
  const { id, hostname, ip, port, allowOrigin } =
    ServerArgsSchema.parse(serverArgs);

  let connectionCountLocal = 0;
  const connectionCountEmitter = new EventEmitter();

  const server = http.createServer((req, res) => {
    // returns Error 403 for HTTP requests from unknown origins
    if (req.headers.origin !== allowOrigin) {
      res.statusCode = 403;
      res.setHeader('content-type', 'text/plain');
      res.setHeader('connection', 'close');
      res.end('Error 403: Forbidden');
    }
  });

  server.on('upgrade', (req, socket) => {
    // returns Error 403 for all websocket requests from unknown origins
    if (req.headers.origin !== allowOrigin) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    // returns Error 400 if the client doesn't send a `Sec-WebSocket-Key` header
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    // Generate the hash for the handshake response
    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    // Send the WebSocket handshake response
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${acceptKey}\r\n\r\n`
    );

    connectionCountLocal++;
    connectionCountEmitter.emit(EVENT_TYPES.CONNECTION_COUNT_CHANGED);

    // broadcast connection counts on every CONNECTION_COUNT_CHANGED event
    serverPool.servers.forEach((server) => {
      server.emitters.connectionCount?.on(EVENT_TYPES.CONNECTION_COUNT_CHANGED, () => {
        socket.write(
          createUnmaskedWebSocketFrame(
            parseEventToString('CONNECTION_COUNT_CHANGED', server)
          )
        );
      });
    });

    socket.on('close', () => {
      connectionCountLocal--;
      connectionCountEmitter.emit(EVENT_TYPES.CONNECTION_COUNT_CHANGED);
    });

    socket.on('error', (error) => {
      console.log(error);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();

      connectionCountLocal--;
      connectionCountEmitter.emit(EVENT_TYPES.CONNECTION_COUNT_CHANGED);
    });
  });

  console.log(`\x1b[32m✔\x1b[0m [ OK ] Server created - ${hostname} #${id}`);

  return {
    get id() {
      return id;
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

    get emitters() {
      return {
        connectionCount: connectionCountEmitter,
      };
    },

    getConnections: () =>
      new Promise((resolve) => {
        server.getConnections((error, count) => resolve(count));
        resolve(-1);
      }),

    getConnectionsSync: () => connectionCountLocal,

    start: () => {
      server.listen(port);
      console.log(`🔵 [ ${hostname} #${id} ] Listening on port ${port}...`);
    },

    close: () => {
      server.close();
      console.log(`🔴 [ ${hostname} #${id} ] Server closed`);
    },
  };
}

export default errorBoundary(createNetMonServer);
