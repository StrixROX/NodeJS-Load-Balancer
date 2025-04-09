import {
  createUnmaskedWebSocketFrame,
  parseMaskedWebSocketFrame,
  parseUnmaskedWebSocketFrame,
} from '../websocketFrames';

describe('websocketFrames', () => {
  it('createUnmaskedWebSocketFrame', () => {
    expect(createUnmaskedWebSocketFrame('test')).toEqual(
      Buffer.from([0x81, 0x04, 0x74, 0x65, 0x73, 0x74])
    );
  });

  it('parseUnmaskedWebSocketFrame', () => {
    expect(
      parseUnmaskedWebSocketFrame(
        Buffer.from([0x81, 0x04, 0x74, 0x65, 0x73, 0x74])
      )
    ).toEqual({ fin: true, opcode: 0x1, payload: 'test' });
  });

  it('parseMaskedWebSocketFrame', () => {
    expect(
      parseMaskedWebSocketFrame(
        Buffer.from([0x81, 0x84, 0x74, 0x65, 0x73, 0x74])
      )
    ).toEqual({ fin: true, opcode: 0x1, payload: 'test' });
  });
});
