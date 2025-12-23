import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    try {
        // 1. Get authorization header
        const authHeader = req.headers.authorization;

        // 2. Check if header is present and starts with 'Bearer '
        if (!authHeader || !authHeader.startsWith("Bearer "))
            return res
                .status(401)
                .json({ message: "Authorizatoin header missing" });

        // 3. Extract token
        const token = authHeader.split(" ")[1];

        // 4. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Attach user info to request object
        req.user = {
            id: decoded.id
        };

        // 6. Proceed to next middleware/controller
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
