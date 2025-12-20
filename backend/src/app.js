import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Welcome to InsightPay Backend" });
});

export default app;
