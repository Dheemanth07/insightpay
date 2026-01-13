import crypto from "crypto";

export function signQR(payload) {
    return crypto
        .createHmac("sha256", process.env.QR_SECRET)
        .update(payload)
        .digest("hex");
}

export function verifyQR(payload, signature) {
    const expected = signQR(payload);
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
    );
}
