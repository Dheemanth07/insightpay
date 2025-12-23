import { addMoneyService } from "../services/wallet.service.js";

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
