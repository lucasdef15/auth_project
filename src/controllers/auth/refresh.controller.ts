import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../services/token.service.js";
import { pool } from "../../db/index.js";

export const refreshTokenController = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  // verificar e decodificar o refresh token
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string };

    // buscar refresh token no banco
    const storedToken = await pool.query(
      `
      SELECT *
      FROM refresh_tokens
      WHERE token = $1
      `,
      [refreshToken]
    );

    if (storedToken.rowCount === 0) {
      // token não existe → possível ataque
      await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [
        payload.id,
      ]);

      return res.status(401).json({ error: "Refresh token reuse detected" });
    }

    const tokenData = storedToken.rows[0];

    // se já foi revogado → reuse
    if (tokenData.revoked_at) {
      await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [
        payload.id,
      ]);

      return res.status(401).json({ error: "Refresh token reuse detected" });
    }

    // gerar novos tokens
    const newAccessToken = generateAccessToken({ id: payload.id });
    const newRefreshToken = generateRefreshToken({ id: payload.id });
    const newRefreshTokenId = randomUUID();

    // transação para atualizar o refresh token no banco com segurança
    await pool.query("BEGIN");

    // revogar o refresh atual
    await pool.query(
      `
      UPDATE refresh_tokens
      SET revoked_at = NOW(), replaced_by_token = $1
      WHERE id = $2
      `,
      [newRefreshTokenId, tokenData.id]
    );

    // salvar o novo refresh
    await pool.query(
      `
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
      `,
      [newRefreshTokenId, payload.id, newRefreshToken]
    );

    // finalizar transação
    await pool.query("COMMIT");

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};
