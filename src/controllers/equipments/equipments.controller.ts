import type { Request, Response } from "express";
import { pool } from "../../db/index.js";

export async function createEquipment(req: Request, res: Response) {
  try {
    const {
      hospitalId,
      descricao,
      fabricante,
      modelo,
      numeroSerie,
      patrimonio,
      calibracao,
      tse,
      mp,
      observacao,
    } = req.body;

    if (!hospitalId) {
      return res.status(400).json({
        message: "Hospital é obrigatório.",
      });
    }

    const hospitalResult = await pool.query(
      `SELECT id FROM hospitals WHERE id = $1`,
      [hospitalId],
    );

    if (hospitalResult.rowCount === 0) {
      return res.status(404).json({
        message: "Hospital não encontrado",
      });
    }

    const insertQuery = `
      INSERT INTO equipments (
        hospital_id,
        descricao,
        fabricante,
        modelo,
        numero_serie,
        patrimonio,
        calibracao,
        tse,
        mp,
        observacao,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDENTE')
      RETURNING *
    `;

    const values = [
      hospitalId,
      descricao,
      fabricante || null,
      modelo || null,
      numeroSerie || null,
      patrimonio || null,
      calibracao ?? false,
      tse ?? false,
      mp ?? false,
      observacao || null,
    ];

    const result = await pool.query(insertQuery, values);

    return res.status(201).json({
      message: "Equipamento criado com sucesso",
      equipment: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao criar equipamento:", error);
    return res.status(500).json({
      message: "Erro interno ao criar equipamento",
    });
  }
}

export async function getEquipmentsByHospital(req: Request, res: Response) {
  const { hospitalId } = req.params;

  if (!hospitalId) {
    return res.status(400).json({
      message: "hospitalId é obrigatório",
    });
  }

  try {
    // (opcional, mas recomendado) verifica se o hospital existe
    const hospitalCheck = await pool.query(
      `SELECT id FROM hospitals WHERE id = $1`,
      [hospitalId],
    );

    if (hospitalCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Hospital não encontrado",
      });
    }

    // busca os equipamentos do hospital
    const result = await pool.query(
      `
      SELECT
        id,
        hospital_id,
        descricao,
        fabricante,
        modelo,
        numero_serie,
        patrimonio,
        calibracao,
        tse,
        mp,
        observacao,
        status,
        created_at
      FROM equipments
      WHERE hospital_id = $1
      ORDER BY descricao ASC
      `,
      [hospitalId],
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar equipamentos por hospital:", error);
    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}
