import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../../services/token.service.js";
import { pool } from "../../db/index.js";

export const refreshTokenController = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  // verificar se o refresh token foi fornecido
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { sub: string };

    // verificar se o refresh token existe no banco
    const result = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND refresh_token = $2",
      [payload.sub, refreshToken]
    );

    // se não existir, retornar erro
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // gerar um novo access token
    const newAccessToken = generateAccessToken({
      id: payload.sub,
    });

    return res.json({ accessToken: newAccessToken });
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};
