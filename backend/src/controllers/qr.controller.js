import QRCode from "qrcode";
import crypto from "crypto";
import prisma from "../prisma.js";
import { signQR, verifyQR } from "../utils/qrSignature.js";

// Generate a QR code for receiving payment
export const generateQR = async (req, res) => {
    try {
        const receiverId = req.user.id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const reference = `qr_${crypto.randomUUID()}`;
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.transaction.create({
            data: {
                reference,
                amount,
                type: "QR",
                status: "PENDING",
                toUserId: receiverId,
                qrExpiresAt: expiresAt,
            },
        });

        const payload = JSON.stringify({
            reference,
            expiresAt: expiresAt.getTime(),
        });

        const signature = signQR(payload);

        const qrData = JSON.stringify({ payload, signature });

        console.log("QR_DATA_TO_VALIDATE:", qrData);

        const qrImage = await QRCode.toDataURL(qrData);

        res.status(200).json({ qrImage, reference, expiresAt });
    } catch (err) {
        console.error("Error generating QR code:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Validate a scanned QR code
export const validateQR = async (req, res) => {
    try {
        const { qrData } = req.body;
        if (!qrData)
            return res.status(400).json({ message: "QR data missing" });

        let parsed;
        try {
            parsed = JSON.parse(qrData);
        } catch (e) {
            return res.status(400).json({ message: "Invalid QR data format" });
        }

        const { payload, signature } = parsed;
        if (!payload || !signature)
            return res
                .status(400)
                .json({ message: "QR payload or signature missing" });

        const isValid = verifyQR(payload, signature);
        if (!isValid)
            return res.status(400).json({ message: "QR tempered or invalid" });

        const { reference, expiresAt } = JSON.parse(payload);

        if (Date.now() > expiresAt)
            return res.status(400).json({ message: "QR code expired" });

        const transaction = await prisma.transaction.findUnique({
            where: { reference },
            include: {
                toUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!transaction)
            return res.status(404).json({ message: "Transaction not found" });

        if (transaction.status !== "PENDING")
            return res.status(400).json({
                message: "QR already used or Transaction already processed",
            });

        return res.status(200).json({
            reference: transaction.reference,
            amount: transaction.amount,
            receiver: transaction.toUser,
            expiresAt: transaction.qrExpiresAt,
        });
    } catch (err) {
        console.error("QR validation error:", err);
        return res.status(500).json({ message: "QR validation failed" });
    }
};

// Confirm payment using a scanned QR code
export const confirmQRPayment = async (req, res) => {
    try {
        const payerId = req.user.id;
        const { qrData } = req.body;
        if (!qrData)
            return res.status(400).json({ message: "QR data missing" });

        let parsed;
        try {
            parsed = JSON.parse(qrData);
        } catch (e) {
            return res.status(400).json({ message: "Invalid QR data format" });
        }

        const { payload, signature } = parsed;
        if (!payload || !signature)
            return res
                .status(400)
                .json({ message: "QR payload or signature missing" });

        const isValid = verifyQR(payload, signature);
        if (!isValid)
            return res.status(400).json({ message: "QR tempered or invalid" });

        const { reference, expiresAt } = JSON.parse(payload);
        if (Date.now() > expiresAt)
            return res.status(400).json({ message: "QR code expired" });

        const result = await prisma.$transaction(async (tx) => {
            const transaction = await prisma.transaction.findUnique({
                where: { reference },
                include: {
                    toUser: true,
                },
            });

            if (!transaction) throw new Error("Transaction not found");

            if (transaction.status !== "PENDING")
                throw new Error(
                    "QR already used or Transaction already processed",
                );

            if (transaction.toUserId === payerId)
                throw new Error("Cannot pay to yourself");

            const payer = await tx.user.findUnique({
                where: { id: payerId },
            });

            if (!payer || payer.balance < transaction.amount)
                throw new Error("Insufficient balance");

            await tx.user.update({
                where: { id: payerId },
                data: {
                    balance: { decrement: transaction.amount },
                },
            });

            await tx.user.update({
                where: { id: transaction.toUserId },
                data: {
                    balance: { increment: transaction.amount },
                },
            });

            await tx.transaction.update({
                where: { reference },
                data: { status: "SUCCESS", fromUserId: payerId },
            });
            return transaction;
        });

        return res
            .status(200)
            .json({
                message: "Payment successful",
                reference: result.reference,
                amount: result.amount,
            });
    } catch (err) {
        console.error("QR payment confirmation error:", err);
        return res
            .status(500)
            .json({ message: err.message || "Payment failed" });
    }
};
