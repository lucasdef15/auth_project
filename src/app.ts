import express from "express";
import authRoutes from "./routes/auth.routes.js";

export const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
