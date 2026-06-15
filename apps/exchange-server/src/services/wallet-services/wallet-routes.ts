import { Router } from "express";
import {
  createWallet,
  updateUserBalance,
  getUserBalance,
} from "./wallet-controller/export";

import { verifyJWT } from "../../middleware/jwt-verify";
import { getAllWallets } from "./wallet-controller/get-all-wallets";

const walletRoutes: Router = Router();

walletRoutes.patch("/updateuserbalance", verifyJWT, updateUserBalance);
walletRoutes.post("/createwallet", verifyJWT, createWallet);
// walletRoutes.get("/getuserbalance/:asset", getUserBalance);
walletRoutes.get("/getuserbalance", verifyJWT, getUserBalance);
walletRoutes.get("/getallwallets", verifyJWT, getAllWallets);

export { walletRoutes };
