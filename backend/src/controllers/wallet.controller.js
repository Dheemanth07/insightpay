import {
    addMoneyService,
    sendMoneyService,
    getTransactionHistoryService,
} from "../services/wallet.service.js";

export const addMoney = async (req, res) => {
    try {
        // 1. Get userId from auth middleware
        const userId = req.user.id;

        // 2. Get amount from request body
        const { amount } = req.body;

        // 3. Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        // 4. Call service to add money
        const result = await addMoneyService(userId, amount);

        // 5. Return success response
        return res.status(200).json({
            message: "Money added successfully",
            balance: result.balance,
        });
    } catch (err) {
        console.error("Add money error:", err);
        return res.status(500).json({
            message: "Failed to add money",
        });
    }
};

export const sendMoney = async (req, res) => {
    try {
        // 1. Get senderId from auth middleware
        const sendId = req.user.id;
        // 2. Get receiverId and amount from request body
        const { receiverId, amount } = req.body;

        // 3. Validate input
        if (!receiverId)
            return res.status(400).json({ message: "Receiver not specified" });

        const parsedAmount = Number(amount);
        if (!parsedAmount || parsedAmount <= 0)
            return res.status(400).json({ message: "Invalid amount" });

        // 4. Check sender and receiver are not the same
        if (sendId === receiverId)
            return res
                .status(400)
                .json({ message: "Cannot send money to yourself" });

        // 4. Call service to send money
        const result = await sendMoneyService(sendId, receiverId, amount);

        // 5. Return success response
        return res.status(200).json({
            message: "Money sent successfully",
            balance: result.senderBalance,
        });
    } catch (err) {
        console.error("Send money error:", err);
        return res.status(500).json({
            message: "Failed to send money",
        });
    }
};

export const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        if (page <= 0 || limit <= 0)
            return res.status(400).json({ message: "Invalid pagination" });

        const result = await getTransactionHistoryService(userId, page, limit);

        return res.status(200).json({
            message: "Transaction history fetched successfully",
            result,
        });
    } catch (err) {
        console.error("Transaction history error:", err);
        return res
            .status(500)
            .json({ message: "Failed to fetch transaction history" });
    }
};
