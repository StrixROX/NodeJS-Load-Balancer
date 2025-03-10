class ServerPool {
  servers = [];

  addServer(server) {
    // check if server already exists
    if (
      this.servers.find((existingServer) => existingServer.id === server.id)
    ) {
      throw new Error(
        "Failed to add server: Server with same id already exists"
      );
    }

    // add server
    this.servers.push(server);
  }

  removeServer(serverId) {
    // check if server exists
    if (
      this.servers.find((existingServer) => existingServer.id === server.id)
    ) {
      throw new Error(
        `Failed to remove server: Server with id ${serverId} does not exist`
      );
    }

    // remove server
    this.servers = this.servers.filter(
      (existingServer) => existingServer.id !== serverId
    );
  }
}

export default ServerPool;
