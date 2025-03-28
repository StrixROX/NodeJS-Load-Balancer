import type { ServerPool } from '../types';

import appAssert from './appAssert';

function createServerPool(initServers: ServerPool['servers'] = []): ServerPool {
  let servers: ServerPool['servers'] = initServers;

  const addServer: ServerPool['addServer'] = (server) => {
    // throw error if server id already exists
    appAssert(
      !servers.find((existingServer) => existingServer.id === server.id),
      'Failed to add server',
      `server with id "${server.id}" already exists`
    );

    // add server
    servers.push(server);
  };

  const removeServerById: ServerPool['removeServerById'] = (serverId) => {
    // throw error if server id does not exist
    appAssert(
      !!servers.find((existingServer) => existingServer.id === serverId),
      'Failed to remove server',
      `server with id "${serverId}" does not exist`
    );

    // remove server
    servers = servers.filter(
      (existingServer) => existingServer.id !== serverId
    );
  };

  return {
    get servers() {
      return servers;
    },
    get size() {
      return servers.length;
    },

    addServer,
    removeServerById,
  };
}

export default createServerPool;
