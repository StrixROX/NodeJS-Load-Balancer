import BaseLoadBalancer from "../BaseLoadBalancer";
import { LoadBalancer } from "../index.d";
import { BaseLoadBalancerArgsType } from "../BaseLoadBalancer";
import Server from "../../Server";

export type WeightedRoundRobinLoadBalancerArgsType =
  BaseLoadBalancerArgsType & {
    serverWeights?: number[];
  };

export default class WeightedRoundRobinLoadBalancer
  extends BaseLoadBalancer
  implements LoadBalancer
{
  private serverWeights: number[];
  private lastServerIndex: number = 0;

  constructor({
    serverPool,
    serverWeights,
  }: WeightedRoundRobinLoadBalancerArgsType) {
    super({ serverPool });
    this.serverWeights =
      serverWeights ?? new Array(this.serverPool.length).fill(1);
  }

  // implement weights system

  redirectRequest(request: Request): Promise<Response> {
    if (!this.serverPool.length) {
      return Promise.resolve(new Response("Request failed: No servers available", { status: 503 }));
    };

    const lastServerIndex = this.lastServerIndex;
    this.lastServerIndex = (lastServerIndex + 1) % this.serverPool.length;

    return this.serverPool[lastServerIndex].sendRequest(request);
  }
}
