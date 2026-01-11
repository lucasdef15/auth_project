import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("UNHANDLED ERROR", {
    path: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: err.stack,
    userId: req.user?.id ?? null,
  });

  return res.status(500).json({ error: "Internal server error" });
}
