const appAssert = require('./appAssert');

class ServerPool {
  servers = [];

  get size() {
    return this.servers.length;
  }

  addServer(server) {
    // check if server already exists
    appAssert(
      !!!this.servers.find((existingServer) => existingServer.id === server.id),
      'Failed to add server',
      'server with same id already exists'
    );

    // add server
    this.servers.push(server);
  }

  removeServerById(serverId) {
    // check if server exists
    appAssert(
      !!this.servers.find((existingServer) => existingServer.id === serverId),
      'Failed to remove server',
      `server with id ${serverId} does not exist`
    );

    // remove server
    this.servers = this.servers.filter(
      (existingServer) => existingServer.id !== serverId
    );
  }
}

module.exports = ServerPool;
