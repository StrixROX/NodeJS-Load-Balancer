export default class Server {
  ip: string;
  hostname: string;
  port: number;
  requestQueue: Promise<Response> | undefined;

  constructor(ip: string, hostname: string, port: number) {
    this.ip = ip;
    this.hostname = hostname;
    this.port = port;
  }

  sendRequest(request: Request): Promise<Response> {
    if (!this.requestQueue) {
      this.requestQueue = new Promise(async (resolve) => {
        const res = new Response(
          `${this.hostname} [${this.ip}]: Received ${await request.text()}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        resolve(res);
      });
    } else {
      this.requestQueue = this.requestQueue.then(
        () =>
          new Promise(async (resolve) => {
            const res = new Response(
              `${this.hostname} [${this.ip}]: Received ${await request.text()}`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
            resolve(res);
          })
      );
    }

    return this.requestQueue;
  }
}
