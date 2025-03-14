function generator() {
  return function getNextServerIndex(serverPool) {
    let leastConnectionCountServerIndex = 0;
    let leastConnectionCount = serverPool.servers[0].getConnectionCount();

    for (let i = 1; i < serverPool.size; i++) {
      if (leastConnectionCount === 0) {
        break;
      }
      if (serverPool.servers[i].getConnectionCount() < leastConnectionCount) {
        leastConnectionCountServerIndex = i;
        leastConnectionCount = serverPool.servers[i].getConnectionCount();
      }
    }

    return leastConnectionCountServerIndex;
  };
}

module.exports = generator;
