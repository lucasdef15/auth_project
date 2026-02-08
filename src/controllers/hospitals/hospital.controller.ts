import type { Request, Response } from "express";
import { pool } from "../../db/index.js";

export const getAllHospitals = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        cnpj
      FROM hospitals
      ORDER BY name ASC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao listar hospitais",
    });
  }
};

export const getHospitalInfo = async (req: Request, res: Response) => {
  const hospitalId = req.params.id;

  try {
    const result = await pool.query(
      `
      SELECT id, name, cnpj
      FROM hospitals
      WHERE id = $1
      `,
      [hospitalId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Hospital não encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const createHospital = async (req: Request, res: Response) => {
  const { name, cnpj } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "O nome do hospital é obrigatório.",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO hospitals (name, cnpj)
      VALUES ($1, $2)
      RETURNING id, name, cnpj
      `,
      [name, cnpj || null],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao criar hospital.",
    });
  }
};
