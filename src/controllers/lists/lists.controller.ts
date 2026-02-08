import type { Request, Response } from "express";
import { pool } from "../../db/index.js";

/**
 * POST /lists
 * Creates a new list with equipments and services
 */
export const createList = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { hospitalId, listType, description, equipments } = req.body;

    /* =========================
       BASIC VALIDATION
    ========================= */

    if (!hospitalId || !listType) {
      return res.status(400).json({
        message: "hospitalId and listType are required",
      });
    }

    if (!Array.isArray(equipments) || equipments.length === 0) {
      return res.status(400).json({
        message: "At least one equipment is required",
      });
    }

    /* =========================
       START TRANSACTION
    ========================= */

    await client.query("BEGIN");

    /* =========================
       1. CREATE LIST
    ========================= */

    const listResult = await client.query(
      `
      INSERT INTO lists (hospital_id, list_type, description)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [hospitalId, listType, description || null],
    );

    const listId = listResult.rows[0].id;

    /* =========================
       2. CREATE LIST_EQUIPMENTS
       AND SERVICES
    ========================= */

    for (const equipment of equipments) {
      const { equipmentId, services } = equipment;

      if (!equipmentId || !Array.isArray(services)) {
        throw new Error("Invalid equipment payload");
      }

      /* 2.1 Insert equipment into list */
      const listEquipmentResult = await client.query(
        `
        INSERT INTO list_equipments (list_id, equipment_id)
        VALUES ($1, $2)
        RETURNING id
        `,
        [listId, equipmentId],
      );

      const listEquipmentId = listEquipmentResult.rows[0].id;

      /* 2.2 Insert services for this equipment */
      for (const serviceType of services) {
        await client.query(
          `
          INSERT INTO list_equipment_services
          (list_equipment_id, service_type)
          VALUES ($1, $2)
          `,
          [listEquipmentId, serviceType],
        );
      }
    }

    /* =========================
       COMMIT TRANSACTION
    ========================= */

    await client.query("COMMIT");

    return res.status(201).json({
      message: "List created successfully",
      listId,
    });
  } catch (error) {
    /* =========================
       ROLLBACK ON ERROR
    ========================= */

    await client.query("ROLLBACK");

    console.error("Error creating list:", error);

    return res.status(500).json({
      message: "Failed to create list",
    });
  } finally {
    client.release();
  }
};

export const getListDetails = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        le.id              AS list_equipment_id,
        e.id               AS equipment_id,
        e.descricao,
        e.fabricante,
        e.modelo,
        e.numero_serie,
        e.patrimonio,
        les.service_type,
        les.service_status
      FROM list_equipments le
      JOIN equipments e
        ON e.id = le.equipment_id
      LEFT JOIN list_equipment_services les
        ON les.list_equipment_id = le.id
      WHERE le.list_id = $1
      ORDER BY e.descricao
      `,
      [id],
    );

    const itemsMap = new Map<number, any>();

    for (const row of result.rows) {
      if (!itemsMap.has(row.list_equipment_id)) {
        itemsMap.set(row.list_equipment_id, {
          id: row.list_equipment_id,
          descricao: row.descricao,
          fabricante: row.fabricante,
          modelo: row.modelo,
          numeroSerie: row.numero_serie,
          patrimonio: row.patrimonio,
          calibracao: false,
          tse: false,
          mp: false,
          status: "PENDENTE",
          observacao: "",
        });
      }

      const item = itemsMap.get(row.list_equipment_id);

      if (row.service_type === "CALIBRATION") item.calibracao = true;
      if (row.service_type === "TSE") item.tse = true;
      if (row.service_type === "MP") item.mp = true;
    }

    return res.json({
      id,
      items: Array.from(itemsMap.values()),
    });
  } catch (error) {
    console.error("Error loading list details:", error);
    return res.status(500).json({ message: "Failed to load list details" });
  }
};

/**
 * GET /lists
 * Returns all created lists
 */
export const getLists = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        l.id,
        l.list_type,
        l.status,
        l.created_at,
        h.name AS hospital_name
      FROM lists l
      JOIN hospitals h
        ON h.id = l.hospital_id
      ORDER BY l.created_at DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error loading lists:", error);
    return res.status(500).json({
      message: "Failed to load lists",
    });
  }
};
