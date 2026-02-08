import type { Request, Response } from "express";
import { pool } from "../../db/index.js";

/**
 * GET /dashboard/stats
 * Returns consolidated dashboard statistics
 */
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const totalsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM hospitals)            AS hospitals,
        (SELECT COUNT(*) FROM equipments)           AS equipments,
        (SELECT COUNT(*) FROM lists)                AS lists,
        (SELECT COUNT(*) FROM lists WHERE status = 'IN_PROGRESS') AS pending_lists
    `);

    const totals = totalsResult.rows[0];

    const lastListsResult = await pool.query(`
      SELECT
        l.id,
        h.name AS hospital_name,
        l.created_at
      FROM lists l
      JOIN hospitals h ON h.id = l.hospital_id
      ORDER BY l.created_at DESC
      LIMIT 5
    `);

    const lastLists = lastListsResult.rows.map((row) => ({
      id: row.id,
      hospitalName: row.hospital_name,
      createdAt: row.created_at,
    }));

    return res.json({
      totals: {
        hospitals: Number(totals.hospitals),
        equipments: Number(totals.equipments),
        lists: Number(totals.lists),
        pendingLists: Number(totals.pending_lists),
      },
      lastLists,
    });
  } catch (error) {
    console.error("Error loading dashboard stats:", error);

    return res.status(500).json({
      message: "Failed to load dashboard stats",
    });
  }
};
