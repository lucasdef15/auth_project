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

  // validação básica
  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  // buscar usuário no banco
  const result = await pool.query(
    "SELECT id, email, password_hash, role FROM users WHERE email = $1",
    [email]
  );

  // usuário não encontrado
  if (result.rowCount === 0) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // usuário encontrado
  const user = result.rows[0];

  // verificar senha
  const passwordMatch = await comparePassword(password, user.password_hash);

  // senha incorreta
  if (!passwordMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // gerar tokens
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  const refreshTokenId = randomUUID();

  // armazenar refresh token no banco
  await pool.query(
    `
    INSERT INTO refresh_tokens (id, user_id, token, expires_at)
    VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
    `,
    [refreshTokenId, user.id, refreshToken]
  );

  return res.json({
    accessToken,
    refreshToken,
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

    const { rows, rowCount } = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [userId]
    );

    if (!rowCount) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("GET /auth/me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
