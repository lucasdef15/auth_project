import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid authorization header" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
    };

    req.user = {
      id: payload.id,
      role: payload.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}
