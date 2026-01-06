import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const [type, token] = authHeader.split(" ");

  // verificação de formato
  if (type !== "Bearer") {
    return res
      .status(401)
      .json({ error: "Invalid authorization header format" });
  }

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
      email: string;
    };

    // só é possivel devido a declaração de módulo em src/types/express.d.ts
    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
