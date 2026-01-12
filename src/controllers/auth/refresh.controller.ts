import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../services/token.service.js";
import { pool } from "../../db/index.js";

export const refreshTokenController = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token missing" });
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string };

    const storedToken = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token = $1`,
      [refreshToken]
    );

    if (storedToken.rowCount === 0) {
      await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [
        payload.id,
      ]);
      return res.status(401).json({ error: "Refresh token reuse detected" });
    }

    const tokenData = storedToken.rows[0];

    if (tokenData.revoked_at) {
      await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [
        payload.id,
      ]);
      return res.status(401).json({ error: "Refresh token reuse detected" });
    }

    const newAccessToken = generateAccessToken({ id: payload.id });
    const newRefreshToken = generateRefreshToken({ id: payload.id });
    const newRefreshTokenId = randomUUID();

    await pool.query("BEGIN");

    await pool.query(
      `
      UPDATE refresh_tokens
      SET revoked_at = NOW(), replaced_by_token = $1
      WHERE id = $2
      `,
      [newRefreshTokenId, tokenData.id]
    );

    await pool.query(
      `
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
      `,
      [newRefreshTokenId, payload.id, newRefreshToken]
    );

    await pool.query("COMMIT");

    // 🔐 Atualiza cookie HTTP-only
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};
// Note: Make sure to have cookie-parser middleware applied in your Express app
// to parse cookies from incoming requests.
