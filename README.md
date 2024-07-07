# Full-Mesh WebRTC

<!--toc:start-->

- [Full-Mesh WebRTC](#full-mesh-webrtc)
  - [Trying it out](#trying-it-out)
    - [Client](#client)
    - [Server](#server)
  - [Deploying](#deploying)
    - [Production client](#production-client)
    - [Production server](#production-server)

<!--toc:end-->

This is an educational implementation with SvelteKit and NodeJS WebSockets for
signalling.

The main purpose here is to observe the limits of a full-mesh topology for a
network and computationally intensive task like video through WebRTC.

## Trying it out

### Client

The client is a simple SvelteKit app. We need a simple environment variable to
point to the server host:

```sh
cd packages/client
echo 'PUBLIC_WS_SERVER_URL="http://localhost:8080"' > .env.local
yarn install
yarn dev
```

### Server

Despite the peer-to-peer architecture, implementation would be much harder
without a signalling server. Here we use websockets.

```sh
cd packages/server
yarn install
yarn dev
```

## Deploying

This is almost the same process. Don't forget to set the client's environment
variable in your deployment environment.

### Production client

```sh
cd packages/client
yarn install
yarn build
yarn start
```

### Production server

```sh
cd packages/server
yarn install
yarn start
```
