import { Router } from "express";
import { verifyJWT } from "../../../middleware/jwt-verify";
import { buyOrderBook, sellOrderBook,  } from "./order-book-controller";


const orderBookRoutes: Router = Router();

orderBookRoutes.get("/buy-order-book/:currencyPair", verifyJWT, buyOrderBook);
orderBookRoutes.get("/sell-order-book/:currencyPair", verifyJWT, sellOrderBook);



export { orderBookRoutes };
