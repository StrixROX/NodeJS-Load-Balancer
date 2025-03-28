# NodeJS Load Balancer

A load balancer made using `NodeJS`, `TypeScript` and `http` module. The load balancer operates in the Application Layer according to OSI model.

## Getting Started

### Clone the Repository

You can clone this repository on your local machine using the following bash command.

```bash
git clone https://github.com/StrixROX/NodeJS-Load-Balancer.git
```

### Build the Project

Before running the project, you will have to build the project. For this you will first have to install the development dependencies using:

```bash
npm install
```

Now, build the project using:

```bash
npm run build
```

The build output will get saved in `/dist` folder.

### Start Initial Environment

`src/index.ts` file provides some starter code to initialise the environment for using the load balancer. You can run it using the `start` script in `package.json` as such:

```bash
npm start # servers run once
```

OR

```bash
npm run dev # servers restart each time you save any source files
```

On first run, your terminal output should look like this:

```
✔ [ OK ] Server created - localhost #1
✔ [ OK ] Server created - localhost #2
✔ [ OK ] Server created - localhost #3
✔ [ OK ] Load Balancer created - localhost #LoadBalancer
✔ [ OK ] Client Page Server created - localhost #ClientPageServer
🟢 [ localhost #1 ] Listening on port 3001...
🟢 [ localhost #2 ] Listening on port 3002...
🟢 [ localhost #3 ] Listening on port 3003...
🔷 [ localhost #LoadBalancer ] Listening on port 5000...
🟢 [ localhost #ClientPageServer ] Listening on port 8080...
```

There are 5 servers that get started by default - _3 backend servers, 1 load balancer server, 1 client page server_. Each server has an idea associated, indicated by a `#` prefix.

You can directly go to `http://localhost:8080` in your browser to open the client interface to start interacting with the app. _(Don't expect too much in terms of design :P)_

### Running Tests

```bash
npm test src/*
```

## Next Steps

- Create a web-socket based interface to monitor network health
- Add health-check functionality
- Increase network throughput
  - Create a variant which operates in the Transport Layer (OSI Layer 4)
  - Try using HTTP/2 via `http2` module
- Implement an SSL layer using `https` module.
