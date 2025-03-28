export type ServerId = string | number;

export type ServerArgs = {
  id: ServerId;
  hostname: string;
  ip: string;
  port: number;
  allowOrigin: string;
};

export type ServerInstance = Readonly<ServerArgs> & {
  start: () => void;
  close: () => void;
  getConnections: () => Promise<number>;
  getConnectionsSync: () => number;
};

export type ServerPool = {
  readonly servers: ServerInstance[];
  readonly size: number;

  addServer: (server: ServerInstance) => void;
  removeServerById: (serverId: ServerId) => void;
};

export type LoadBalancerAlgorithm = (serverPool: ServerPool, currentServerIndex: number) => number;
