import createLocalServer from "./utils/createLocalServer.js";
import ServerPool from "./utils/ServerPool.js";

const pool = new ServerPool();
const POOL_SIZE = 4;

for (let i = 0; i < POOL_SIZE; i++) {
  pool.addServer(createLocalServer(3000 + i, i + 1));
}
