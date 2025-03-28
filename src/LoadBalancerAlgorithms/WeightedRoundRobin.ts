import type { LoadBalancerAlgorithm } from "../types";

function generator(serverWeights: number[]): LoadBalancerAlgorithm {
  let serverCallCount = 0;

  return function getNextServerIndex(serverPool, currentServerIndex) {
    serverCallCount++;

    if (serverCallCount < serverWeights[currentServerIndex]) {
      return currentServerIndex;
    } else {
      serverCallCount = 0;

      return (currentServerIndex + 1) % serverPool.size;
    }
  };
}

export default generator;
