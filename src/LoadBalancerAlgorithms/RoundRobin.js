function getNextServerIndex(serverPool, currentServerIndex) {
  return {
    server: serverPool.servers[currentServerIndex],
    nextServerIndex: (currentServerIndex + 1) % serverPool.size,
  };
}

module.exports = getNextServerIndex;
