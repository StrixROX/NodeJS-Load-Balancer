import BaseLoadBalancer from "../BaseLoadBalancer";
import { LoadBalancer } from "../index.d";
import { BaseLoadBalancerArgsType } from "../BaseLoadBalancer";

export type RoundRobinLoadBalancerArgsType = BaseLoadBalancerArgsType;

export default class RoundRobinLoadBalancer
  extends BaseLoadBalancer
  implements LoadBalancer
{
  private lastServerIndex: number = 0;

  constructor({ serverPool }: RoundRobinLoadBalancerArgsType) {
    super({ serverPool });
  }

  redirectRequest(request: Request): Promise<Response> {
    if (!this.serverPool.length) {
      return Promise.resolve(new Response("Request failed: No servers available", { status: 503 }));
    };

    const lastServerIndex = this.lastServerIndex;
    this.lastServerIndex = (lastServerIndex + 1) % this.serverPool.length;

    return this.serverPool[lastServerIndex].sendRequest(request);
  }
}
