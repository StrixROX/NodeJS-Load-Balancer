import { createLoadBalancer } from "./LoadBalancer";
import Server from "./Server";

const loadBalancer = createLoadBalancer("round-robin");

const s1 = new Server("192.168.1.1", "server #1", 8080);
const s2 = new Server("192.168.1.2", "server #2", 8080);
const s3 = new Server("192.168.1.3", "server #3", 8080);
const s4 = new Server("192.168.1.4", "server #4", 8080);

setTimeout(() => loadBalancer.addServer(s1), 0);
setTimeout(() => loadBalancer.addServer(s2), 100);
setTimeout(() => loadBalancer.addServer(s3), 200);
setTimeout(() => loadBalancer.addServer(s4), 300);

setTimeout(() => {
  for (let i = 0; i < 10; i++) {
    loadBalancer
      .redirectRequest(
        new Request("http://localhost:8080", {
          method: "POST",
          body: "Hello World",
        })
      )
      .then((res) => res.text())
      .then((res) => console.log(res));
  }
}, 400);
