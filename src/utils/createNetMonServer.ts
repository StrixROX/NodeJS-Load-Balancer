// NetMon - Network Monitor

import crypto from 'crypto';
import http from 'http';

import { ServerArgsSchema } from '../schema';
import type { ServerArgs, ServerInstance } from '../types';

import errorBoundary from './errorBoundary';

function createNetMonServer(serverArgs: ServerArgs): ServerInstance {
  const { id, hostname, ip, port, allowOrigin } =
    ServerArgsSchema.parse(serverArgs);

  let connectionCountLocal = 0;

  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'access-control-allow-origin': '*',
    });
    res.end('This is a WebSocket server.\n');
  });

  // Listen for the 'upgrade' event to handle WebSocket connections
  server.on('upgrade', (req, socket) => {
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

    // Listen for WebSocket messages
    socket.on('data', (data) => {
      console.log('Received:', decodeWebSocketFrame(data));

      // Echo the data back to the client
      socket.write(createWebSocketFrameUnmasked("hello world"));
    });

    socket.on('close', () => {
      console.log('WebSocket connection closed.');
      connectionCountLocal--;
    });

    socket.on('error', (error) => {
      console.log(error);
      socket.write('HTTP/1.1 500 Server Error\r\n\r\n');
      socket.destroy();
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


function createWebSocketFrameUnmasked(message: string) {
  // Convert the message to a UTF-8 encoded buffer
  const payload = Buffer.from(message, 'utf-8');

  // Create the frame
  const frame = Buffer.alloc(2 + payload.length);
  
  // First byte: FIN bit (1) and Opcode (0x1 for text frame)
  frame[0] = 0x81;

  // Second byte: Payload length
  frame[1] = payload.length;

  // Copy payload into the frame
  payload.copy(frame, 2);

  return frame;
};

const parseWebSocketFrameUnmasked = (frame: Buffer) => {
  // Get the FIN and Opcode from the first byte
  const fin = (frame[0] & 0x80) !== 0;
  const opcode = frame[0] & 0x0F;

  // Get the payload length from the second byte
  const payloadLength = frame[1] & 0x7F;

  // Extract the payload data
  const payload = frame.slice(2, 2 + payloadLength).toString('utf-8');

  return {
    fin,
    opcode,
    payload,
  };
};

const decodeWebSocketFrame = (frame: Buffer) => {
  // First byte: FIN and Opcode (not used for decoding here)
  const fin = (frame[0] & 0x80) !== 0; // Not necessary for decoding payload
  const opcode = frame[0] & 0x0F; // Opcode: 0x1 means text frame

  // Second byte: Mask bit and Payload length
  const masked = (frame[1] & 0x80) !== 0; // Check if the payload is masked
  let payloadLength = frame[1] & 0x7F;

  let offset = 2; // Start after the first two bytes

  // Handle extended payload lengths
  if (payloadLength === 126) {
    // 2-byte extended payload length
    payloadLength = frame.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLength === 127) {
    // 8-byte extended payload length
    // Note: This example does not handle such a large payload for simplicity
    throw new Error("Large payloads not supported in this example.");
  }

  // Read masking key (4 bytes)
  const maskingKey = frame.slice(offset, offset + 4);
  offset += 4;

  // Extract masked payload
  const maskedPayload = frame.slice(offset, offset + payloadLength);

  // Decode the payload using the masking key
  const payload = Buffer.alloc(payloadLength);
  for (let i = 0; i < payloadLength; i++) {
    payload[i] = maskedPayload[i] ^ maskingKey[i % 4];
  }

  return {
    fin,
    opcode,
    payload: payload.toString('utf-8'), // Convert payload to string (for text frames)
  };
};
