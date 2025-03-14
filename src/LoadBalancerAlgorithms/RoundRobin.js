function generator() {
  return function getNextServerIndex(serverPool, currentServerIndex) {
    return (currentServerIndex + 1) % serverPool.size;
  };
}

module.exports = generator;
