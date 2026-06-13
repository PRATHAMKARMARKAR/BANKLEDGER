import { Router } from "express";
import {
  createAccountController,
  getUserAccountsController,
  getAccountBalanceController,
} from "../controllers/account.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create", verifyJWT, createAccountController);

router.get("/my", verifyJWT, getUserAccountsController);

// router.get("/:accountId", verifyJWT, getAccountByIdController);

router.get("/balance/:accountId", verifyJWT, getAccountBalanceController);

// router.delete("/:accountId", verifyJWT, deleteAccountController);

// router.patch("/toggle/:accountId", verifyJWT, toggleAccountStatusController);

export default router;