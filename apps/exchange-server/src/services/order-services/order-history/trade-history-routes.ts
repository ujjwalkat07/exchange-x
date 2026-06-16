import { Router } from "express";
import { verifyJWT } from "../../../middleware/jwt-verify";
import { tradeHistoryController } from "./trade-history-controller";

const tradeHistoryRoutes: Router = Router();

tradeHistoryRoutes.get("/", verifyJWT, tradeHistoryController);

export { tradeHistoryRoutes };
