import express from "express";
import { addCard,getCards,deleteCard } from "../controllers/card.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addCard);
router.get("/", authMiddleware, getCards);
router.delete("/:cardId", authMiddleware, deleteCard);

export default router;
