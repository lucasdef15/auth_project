import type { Request, Response } from "express";
import { pool } from "../db/index.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../services/token.service.js";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.sendStatus(400).json({
      error: "Email and password are required",
    });

  // buscar o usuário pelo email
  const result = await pool.query(
    "SELECT id, email, password_hash, role FROM users WHERE email = $1",
    [email]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = result.rows[0];

  // 🔐 2. Comparar senha
  const passwordMatch = await comparePassword(password, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // 🎟️ 3. Gerar tokens
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  // 💾 4. Salvar refresh token no banco
  await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
    refreshToken,
    user.id,
  ]);

  // 🚀 5. Responder
  return res.json({
    accessToken,
    refreshToken,
  });
};

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body; // não le role aqui porque só admin pode setar

  const role = "user"; // default role

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required!" });
  }

  // Verificar se o usuário já existe
  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rowCount! > 0) {
    return res.status(409).json({ error: "User already exists!" });
  }

  // Hash da senha
  const password_hash = await hashPassword(password);

  // Inserir o novo usuário no banco de dados
  await pool.query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)",
    [email, password_hash, role]
  );

  return res.status(201).json({ message: "User registered successfully!" });
};

export const logout = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  await pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [
    userId,
  ]);

  return res.status(204).send({ message: "Logged out successfully" });
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
