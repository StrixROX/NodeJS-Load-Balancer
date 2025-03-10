import { LoadBalancer, LoadBalancerArgsTypes } from "./index.d";
import RoundRobinLoadBalancer from "./variants/RoundRobin";
import WeightedRoundRobinLoadBalancer from "./variants/WeightedRoundRobin";

export function createLoadBalancer<T extends keyof LoadBalancerArgsTypes>(
  type: T,
  options?: LoadBalancerArgsTypes[T]
): LoadBalancer {
  switch (type) {
    case "round-robin":
      return new RoundRobinLoadBalancer(options ?? { serverPool: [] });
    case "weighted-round-robin":
      return new WeightedRoundRobinLoadBalancer(options ?? { serverPool: [] });
    default:
      return new RoundRobinLoadBalancer(options ?? { serverPool: [] });
  }
}
