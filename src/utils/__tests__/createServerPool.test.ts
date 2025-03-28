import createEchoServer from '../createEchoServer';
import createServerPool from '../createServerPool';

const serverPool = createServerPool();

const s1 = createEchoServer({
  id: 1,
  hostname: 'localhost',
  ip: '127.0.0.1',
  port: 3000,
  allowOrigin: 'http://localhost:5000',
});
const s2 = createEchoServer({
  id: 2,
  hostname: 'localhost',
  ip: '127.0.0.1',
  port: 3001,
  allowOrigin: 'http://localhost:5000',
});
const s3 = createEchoServer({
  id: 3,
  hostname: 'localhost',
  ip: '127.0.0.1',
  port: 3002,
  allowOrigin: 'http://localhost:5000',
});

describe('ServerPool', () => {
  it('can add servers to pool', () => {
    expect(serverPool.size).toBe(0);

    serverPool.addServer(s1);

    expect(serverPool.size).toBe(1);
    expect(serverPool.servers[0]).toBe(s1);

    serverPool.addServer(s2);

    expect(serverPool.size).toBe(2);
    expect(serverPool.servers[1]).toBe(s2);

    serverPool.addServer(s3);

    expect(serverPool.size).toBe(3);
    expect(serverPool.servers[2]).toBe(s3);
  });

  it('throws error when adding server with id that already exists in the pool', () => {
    expect(() => serverPool.addServer(s1)).toThrow(
      'server with id "1" already exists'
    );
  });

  it('can remove servers from pool', () => {
    expect(serverPool.size).toBe(3);

    serverPool.removeServerById(1);

    expect(serverPool.size).toBe(2);
    expect(serverPool.servers[0]).toBe(s2);
    expect(serverPool.servers[1]).toBe(s3);

    serverPool.removeServerById(2);

    expect(serverPool.size).toBe(1);
    expect(serverPool.servers[0]).toBe(s3);

    serverPool.removeServerById(3);

    expect(serverPool.size).toBe(0);
  });

  it('throws error when removing server with id that does not exist in the pool', () => {
    expect(() => serverPool.removeServerById(4)).toThrow(
      'server with id "4" does not exist'
    );
  });
});
