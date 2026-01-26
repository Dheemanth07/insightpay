import QRCode from "qrcode";
import crypto from "crypto";
import prisma from "../prisma.js";
import { signQR,verifyQR } from "../utils/qrSignature.js";

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
            return res
                .status(400)
                .json({
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
