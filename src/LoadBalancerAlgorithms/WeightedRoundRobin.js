function generator(serverWeights) {
  let requestQueueSize = 0;

  return function getNextServerIndex(serverPool, currentServerIndex) {
    if (requestQueueSize < serverWeights[currentServerIndex] - 1) {
      requestQueueSize++;

      return {
        server: serverPool.servers[currentServerIndex],
        nextServerIndex: currentServerIndex,
      };
    } else if (requestQueueSize === serverWeights[currentServerIndex] - 1) {
      requestQueueSize = 0;

      return {
        server: serverPool.servers[currentServerIndex],
        nextServerIndex: (currentServerIndex + 1) % serverPool.size,
      };
    }
  };
}

module.exports = generator;
