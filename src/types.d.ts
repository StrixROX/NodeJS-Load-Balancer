import { z } from 'zod';

import { ServerArgsSchema, ServerIdSchema } from './schema';

export type ServerId = z.infer<typeof ServerIdSchema>;
export type ServerArgs = z.infer<typeof ServerArgsSchema>;

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

export type LoadBalancerAlgorithm = (
  serverPool: ServerPool,
  currentServerIndex: number
) => number;
