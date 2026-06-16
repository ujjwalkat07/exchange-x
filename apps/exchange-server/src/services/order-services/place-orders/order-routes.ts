import { Router } from "express";
import { verifyJWT } from "../../../middleware/jwt-verify";
import {
  buyOrder,
  cancelOrder,
  getOpenOrders,
  sellOrder,
  closePosition,
  openPosition,
} from "./orders-controllers/export";

const orderRoutes: Router = Router();

orderRoutes.post("/buyorder", verifyJWT, buyOrder);
orderRoutes.post("/sellorder", verifyJWT, sellOrder);
orderRoutes.post("/cancelOrder", verifyJWT, cancelOrder);

orderRoutes.get("/openPositions", verifyJWT, openPosition);
orderRoutes.get("/openOrders", verifyJWT, getOpenOrders);
orderRoutes.get("/closedPositions", verifyJWT, closePosition);

export { orderRoutes };
