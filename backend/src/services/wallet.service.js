import prisma from "../prisma.js";

export const addMoneyService = async (userId, amount) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Update user balance
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                balance: { increment: amount }
            }
        });

        // 2. Log transaction
        await tx.transaction.create({
            data: {
                amount,
                type: "ADD",
                status: "SUCCESS",
                fromUserId: null,
                toUserId: userId,
            },
        });

        return updatedUser;
    });
};
