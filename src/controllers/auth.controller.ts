import type { Request, Response } from "express";
import { pool } from "../db/index.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../services/token.service.js";
import { randomUUID } from "crypto";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  const result = await pool.query(
    "SELECT id, email, password_hash, role FROM users WHERE email = $1",
    [email]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = result.rows[0];

  const passwordMatch = await comparePassword(password, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // 🔥 REVOGA TODAS AS SESSÕES ANTES DO LOGIN
  await pool.query(
    `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE user_id = $1
      AND revoked_at IS NULL
      AND expires_at > NOW()
    `,
    [user.id]
  );

  // gera tokens
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  const refreshTokenId = randomUUID();

  // cria nova sessão
  await pool.query(
    `
    INSERT INTO refresh_tokens (id, user_id, token, expires_at)
    VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
    `,
    [refreshTokenId, user.id, refreshToken]
  );

  // cookie httpOnly
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    accessToken,
  });
};

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const role = "user";

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required!" });
  }

  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rowCount! > 0) {
    return res.status(409).json({ error: "User already exists!" });
  }

  const password_hash = await hashPassword(password);

  await pool.query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)",
    [email, password_hash, role]
  );

  return res.status(201).json({ message: "User registered successfully!" });
};

export const logout = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // revogar todos os refresh tokens do usuário
  await pool.query(
    `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE user_id = $1 AND revoked_at IS NULL
    `,
    [userId]
  );

  return res.status(204).send();
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const userResult = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // busca sessões realmente ativas
    const sessions = await pool.query(
      `
      SELECT id, created_at
      FROM refresh_tokens
      WHERE user_id = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      `,
      [userId]
    );

    const currentSession = sessions.rows[0] ?? null;

    return res.status(200).json({
      id: userResult.rows[0].id,
      email: userResult.rows[0].email,
      role: userResult.rows[0].role,
      session: currentSession
        ? {
            id: currentSession.id,
            created_at: currentSession.created_at,
            totalActiveSessions: sessions.rowCount,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /auth/me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
