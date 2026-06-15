import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";

export class WebSocketServerInitializer {
  public wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("WebSocket connection established");
      ws.on("error", (error: Error) => {
        console.error("WebSocket client error:", error);
      });
    });

    this.wss.on("error", (error: Error) => {
      console.error("WebSocketServer error:", error);
    });
  }

  emit = (event: string, message: string): void => {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, message }));
      }
    });
  };
}
