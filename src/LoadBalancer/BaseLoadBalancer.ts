import Server from "../Server";
import { LoadBalancer } from "./index.d";

export type BaseLoadBalancerArgsType = {
  serverPool: Server[];
}

class BaseLoadBalancer
  implements Pick<LoadBalancer, "addServer" | "removeServer">
{
  serverPool: Server[];

  constructor({ serverPool = [] }: BaseLoadBalancerArgsType) {
    this.serverPool = serverPool;
  }

  addServer(server: Server): void {
    if (
      this.serverPool.find((existingServer) => existingServer.ip === server.ip)
    ) {
      throw new Error(
        `Failed to add server "${server.hostname}": Server with IP ${server.ip} already exists`
      );
    }

    this.serverPool.push(server);

    console.log(`Added server "${server.hostname}" with IP ${server.ip}`);
  }

  removeServer(server: Server): void {
    if (
      !this.serverPool.find((existingServer) => existingServer.ip === server.ip)
    ) {
      throw new Error(
        `Failed to remove server "${server.hostname}": Server with IP ${server.ip} not found`
      );
    }

    this.serverPool = this.serverPool.filter(
      (existingServer) => existingServer.ip !== server.ip
    );

    console.log(`Removed server "${server.hostname}" with IP ${server.ip}`);
  }
}

export default BaseLoadBalancer;
