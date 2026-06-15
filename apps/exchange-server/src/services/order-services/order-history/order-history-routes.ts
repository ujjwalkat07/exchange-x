import { Router } from "express";
import { verifyJWT } from "../../../middleware/jwt-verify";
import { orderHistoryController } from "./order-history-controller";

const orderHistoryRoutes: Router = Router();

orderHistoryRoutes.get("/", verifyJWT, orderHistoryController);

export { orderHistoryRoutes };
