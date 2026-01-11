import type { Request, Response, NextFunction } from "express";

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    const log = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id ?? null,
      time: new Date().toISOString(),
    };

    if (res.statusCode >= 500) {
      console.error("❌ ERROR", log);
    } else if (res.statusCode >= 400) {
      console.warn("⚠️ WARN", log);
    } else {
      console.log("ℹ️ INFO", log);
    }
  });

  next();
}
