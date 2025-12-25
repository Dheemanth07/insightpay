import prisma from "../prisma.js";
import { generateCardToken } from "../utils/tokenization.js";

export const addCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardNumber, expiryMonth, expiryYear, brand } = req.body;

        const last4 = cardNumber.slice(-4);
        const token = generateCardToken();

        const card = await prisma.card.create({
            data: {
                userId,
                cardToken: token,
                last4,
                brand,
                expiryMonth,
                expiryYear,
            },
        });

        return res
            .status(201)
            .json({ message: "Card added successfully", card });
    } catch (err) {
        console.error("Error adding card:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getCards = async (req, res) => {
    try {
        const userId = req.user.id;

        const cards = await prisma.card.findMany({
            where: { userId },
            select: {
                id: true,
                last4: true,
                brand: true,
                expiryMonth: true,
                expiryYear: true,
                createdAt: true,
            },
        });

        return res.status(200).json({ cards });
    } catch (err) {
        console.error("Error retrieving cards:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId } = req.params;

        const card = await prisma.card.findFirst({
            where: { id: cardId, userId },
        });

        if (!card) return res.status(404).json({ message: "Card not found" });

        await prisma.card.delete({
            where: { id: cardId },
        });
        return res.status(200).json({ message: "Card deleted successfully" });
    } catch (err) {
        console.error("Error deleting card:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
