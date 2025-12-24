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

export const getTransactionHistoryService = async (
    userId,
    limit,
    cursor,
    type,
    from,
    to
) => {
    const where = {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
    };

    // 1. Date range filter
    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
    }

    // 2. Fetch transactions involving the user with cursor-based pagination
    const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { id: "desc" },
        take: limit + 1,
        ...(cursor && {
            cursor: { id: cursor },
            skip: 1,
        }),
    });

    // 3. Determine if there's a next page
    const hasNextPage = transactions.length > limit;
    if (hasNextPage) transactions.pop();

    // 4. Format transactions
    let formatted = transactions.map((tx) => {
        const isSender = tx.fromUserId === userId;
        return {
            id: tx.id,
            amount: tx.amount,
            direction: isSender ? "SEND" : "RECEIVE",
            signedAmount: isSender ? -tx.amount : +tx.amount,
            status: tx.status,
            createdAt: tx.createdAt,
            fromUserId: tx.fromUserId,
            toUserId: tx.toUserId,
        };
    });

    // 5. Type filter (SEND / RECEIVE)
    if (type === "SEND") {
        formatted = formatted.filter((t) => t.direction === "SEND");
    }
    if (type === "RECEIVE") {
        formatted = formatted.filter((t) => t.direction === "RECEIVE");
    }

    // 6. Return formatted transactions with next cursor
    return {
        transactions: formatted,
        nextCursor: hasNextPage ? formatted[formatted.length - 1].id : null,
    };
};
