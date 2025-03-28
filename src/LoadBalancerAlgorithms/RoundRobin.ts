import type { LoadBalancerAlgorithm } from "../types";

function generator(): LoadBalancerAlgorithm {
  return function getNextServerIndex(serverPool, currentServerIndex) {
    return (currentServerIndex + 1) % serverPool.size;
  };
}

export default generator;
