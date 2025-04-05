export const parseUnmaskedWebSocketFrame = (frame: Buffer) => {
  // Get the FIN and Opcode from the first byte
  const fin = (frame[0] & 0x80) !== 0;
  const opcode = frame[0] & 0x0f;

  // Get the payload length from the second byte
  const payloadLength = frame[1] & 0x7f;

  // Extract the payload data
  const payload = frame.slice(2, 2 + payloadLength).toString('utf-8');

  return {
    fin,
    opcode,
    payload,
  };
};

export const parseMaskedWebSocketFrame = (frame: Buffer) => {
  // First byte: FIN and Opcode (not used for decoding here)
  const fin = (frame[0] & 0x80) !== 0; // Not necessary for decoding payload
  const opcode = frame[0] & 0x0F; // Opcode: 0x1 means text frame

  // Second byte: Mask bit and Payload length
  // const masked = (frame[1] & 0x80) !== 0; // Check if the payload is masked
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

export const createUnmaskedWebSocketFrame = (message: string) => {
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