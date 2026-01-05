import type { Request, Response, NextFunction } from "express";

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Assuming req.user is populated by previous authentication middleware

    // check if user is authenticated
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // check if user has one of the allowed roles
    if (!allowedRoles.includes(user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden: insufficient permissions" });
    }

    next();
  };
}
