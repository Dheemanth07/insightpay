import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { generateQR,validateQR,confirmQRPayment } from "../controllers/qr.controller.js";

const router = express.Router();

router.post("/generate", authMiddleware, generateQR);
router.post("/validate", authMiddleware, validateQR);
router.post("/confirm", authMiddleware, confirmQRPayment);

export default router;