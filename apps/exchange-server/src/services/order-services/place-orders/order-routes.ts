import { Router } from "express";
import { verifyJWT } from "../../../middleware/jwt-verify";
import { buyOrder, cancelOrder, getRestingOrders, sellOrder } from "./orders-controllers/export";
import { closePosition } from "./orders-controllers/order-close-position";

const orderRoutes: Router = Router();

orderRoutes.post("/buyorder", verifyJWT, buyOrder);
orderRoutes.post("/sellorder", verifyJWT, sellOrder);
orderRoutes.post("/cancelOrder", verifyJWT, cancelOrder);

// orderRoutes.get("/openPositions", verifyJWT, openPosition);
orderRoutes.get("/restingOrders", verifyJWT, getRestingOrders);
orderRoutes.get("/closedPositions", verifyJWT, closePosition);

export { orderRoutes };
