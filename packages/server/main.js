import WebSocket, { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

const wss = new WebSocketServer({ server });

const clients = [];

wss.on("connection", (currentClient) => {
  clients.push(currentClient);

  currentClient.on("message", (message) => {
    for (const [index, client] of clients.entries()) {
      if (client.readyState === WebSocket.OPEN) {
        if (client !== currentClient) {
          client.send(message, { binary: false });
        }
      } else {
        clients.splice(index, 1);
      }
    }
    console.log("client count:", clients.length);
  });

  currentClient.on("close", () => {
    clients.splice(clients.indexOf(currentClient), 1);
    console.log("client count:", clients.length);
  });
});

server.listen(8080, () => {
  console.log(`Server started on http://0.0.0.0:8080`);
});
