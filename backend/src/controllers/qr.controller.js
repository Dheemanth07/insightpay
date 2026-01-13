import QRCode from "qrcode";
import crypto from "crypto";
import prisma from "../prisma.js";
import { signQR } from "../utils/qrSignature.js";

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
        const qrImage = await QRCode.toDataURL(qrData);

        res.status(200).json({ qrImage, reference, expiresAt });
    } catch (err) {
        console.error("Error generating QR code:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
