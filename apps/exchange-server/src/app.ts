import express,{Express} from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRoutes } from "./services/auth-services/auth-routes";
import { walletRoutes } from "./services/wallet-services/wallet-routes";
import { initKafkaService } from "./services/kafka-services/kafka-initaliazation";
import { orderRoutes } from "./services/order-services/place-orders/order-routes";
import { redisInit } from "./config/redis-config/redis-initialisatio";
import { orderHistoryRoutes } from "./services/order-services/order-history/order-history-routes";
import { config } from "./config/env-config/config";
import { orderBookRoutes } from "./services/order-services/orderbook/order-book-route";
import { createServer } from "http";
import { WebSocketServerInitializer } from "./websockets/websocket-initializer";

dotenv.config({
  path: "./.env",
});

const app:Express = express();
const httpServer = createServer(app);
const wss = new WebSocketServerInitializer(httpServer);

initKafkaService();
redisInit();

app.use(
  cors({
    origin: config.CORS_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser()); //for managing cookies
app.use(express.urlencoded({ extended: true }));

//websocket connecttion...........
app.locals.emit = wss.emit; // Keep `this` bound so emit can access wss.clients
export const emitToClients = wss.emit;
//routes.............
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/order-history", orderHistoryRoutes);
app.use("/api/order-book", orderBookRoutes);

app.get("/", (_req, res) => {
  res.send(
    "Welcome to the Crypto Trading Platform API | Designed and Developed by Ujjwal Katiyar",
  );
});
export { app, httpServer };
