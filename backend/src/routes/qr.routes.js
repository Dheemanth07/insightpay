import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { generateQR } from "../controllers/qr.controller.js";

const router = express.Router();

router.post("/generate", authMiddleware, generateQR);

export default router;