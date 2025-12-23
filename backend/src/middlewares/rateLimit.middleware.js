import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 200,
    message:{
        message: "Too many attempts, please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
})