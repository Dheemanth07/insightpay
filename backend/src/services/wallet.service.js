import prisma from "../prisma.js";

export const addMoneyService = async (userId, amount) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Update user balance
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                balance: { increment: amount },
            },
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

export const sendMoneyService = async (senderId, receiverId, amount) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Check if sender exists
        const sender = await tx.user.findUnique({ where: { id: senderId } });
        if (!sender) throw new Error("Sender not found");

        // 2. Check if sender has sufficient balance
        if (sender.balance < amount) throw new Error("Insufficient balance");

        // 3. Check if receiver exists
        const receiver = await tx.user.findUnique({
            where: { id: receiverId },
        });
        if (!receiver) throw new Error("Receiver not found");

        // 4. Deduct amount from sender
        const updatedSender = await tx.user.update({
            where: { id: senderId },
            data: {
                balance: { decrement: amount },
            },
        });

        // 5. Add amount to receiver
        await tx.user.update({
            where: { id: receiverId },
            data: {
                balance: { increment: amount },
            },
        });

        // 6. Log sender transaction
        await tx.transaction.create({
            data: {
                amount,
                type: "SEND",
                status: "SUCCESS",
                fromUserId: senderId,
                toUserId: receiverId,
            },
        });

        return { senderBalance: updatedSender.balance };
    });
};

export const getTransactionHistoryService = async (userId, page, limit) => {
    // 1. Calculate offset
    const skip = (page - 1) * limit;

    // 2. Fetch transactions involving the user with pagination
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
        orderBy: {
            createdAt: "desc",
        },
        skip,
        take: limit,
    });

    // 3.Calculate total transactions
    const totalTransactions = await prisma.transaction.count({
        where: {
            OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
    });

    // 4. Format transactions
    const formattedTransactions = transactions.map((tx) => {
        const isSender = tx.fromUserId === userId;

        return {
            id: tx.id,
            direction: isSender ? "SENT" : "RECEIVED",
            signedAmount: isSender ? -tx.amount : + tx.amount,
            status: tx.status,
            createdAt: tx.createdAt,
            fromUserId: tx.fromUserId,
            toUserId: tx.toUserId,
        };
    });

    // 5. Return formatted transactions with pagination info
    return {
        page,
        limit,
        totalPages: Math.ceil(totalTransactions / limit),
        total: totalTransactions,
        transactions: formattedTransactions,
    };
};
