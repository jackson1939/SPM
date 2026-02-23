// lib/apiError.ts — Manejo centralizado de errores de PostgreSQL en las APIs
import type { NextApiResponse } from "next";

interface PgError {
  code?: string;
  message: string;
  detail?: string;
}

/**
 * Maneja errores de PostgreSQL y devuelve respuestas HTTP apropiadas.
 * Uso:
 *   } catch (error: any) {
 *     return handleApiError(res, error, "productos");
 *   }
 */
export function handleApiError(
  res: NextApiResponse,
  error: PgError,
  contexto = "operación"
): void {
  console.error(`[API Error] ${contexto}:`, error.message, error.code ? `(pg:${error.code})` : "");

  switch (error.code) {
    // Unique constraint violation
    case "23505":
      res.status(409).json({ error: "Ya existe un registro con ese valor único (ej: código de barras duplicado)" });
      return;

    // Foreign key violation
    case "23503":
      res.status(409).json({
        error: "No se puede eliminar porque tiene registros relacionados (ventas o compras asociadas)",
      });
      return;

    // Not null violation
    case "23502":
      res.status(400).json({ error: "Falta un campo obligatorio en la solicitud" });
      return;

    // Undefined table
    case "42P01":
      res.status(503).json({ error: "La tabla de base de datos no existe. Ejecuta las migraciones." });
      return;

    // Undefined column
    case "42703":
      res.status(503).json({ error: "Error de esquema de base de datos. Ejecuta las migraciones." });
      return;

    // Generated column / calculated field
    case "428C9":
      res.status(400).json({ error: "No se puede modificar un campo calculado automáticamente" });
      return;

    default:
      res.status(500).json({
        error: "Error interno del servidor",
        // Solo mostrar detalles en desarrollo
        ...(process.env.NODE_ENV === "development" && {
          message: error.message,
          code: error.code,
        }),
      });
  }
}
