import { LoadBalancers } from "./index.d";
import { RoundRobinLoadBalancerArgsType } from "./variants/RoundRobin";
import { WeightedRoundRobinLoadBalancerArgsType } from "./variants/WeightedRoundRobin";

export type LoadBalancerArgsTypes = {
  "round-robin": RoundRobinLoadBalancerArgsType,
  "weighted-round-robin": WeightedRoundRobinLoadBalancerArgsType,
};

export interface LoadBalancer {
  addServer(server: Server): void;
  removeServer(server: Server): void;
  redirectRequest(request: Request): Promise<Response>;
}
