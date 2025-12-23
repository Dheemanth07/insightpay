import express from "express";
import { addMoney } from "../controllers/wallet.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addMoney);

export default router;
