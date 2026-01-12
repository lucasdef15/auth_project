import express from "express";
import authRoutes from "./routes/auth.routes.js";
import cors from "cors";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";

export const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(loggerMiddleware);
app.use(errorHandler);
app.use("/auth", authRoutes);
