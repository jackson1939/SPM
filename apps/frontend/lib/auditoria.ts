// lib/auditoria.ts — Registro de auditoría de acciones del sistema
import getDbClient from "../db";

export type AccionAuditoria =
  | "login"
  | "logout"
  | "venta_creada"
  | "compra_creada"
  | "producto_creado"
  | "producto_editado"
  | "producto_eliminado"
  | "config_actualizada"
  | "migracion_ejecutada"
  | "clear_database";

/**
 * Registra una acción en la tabla de auditoría.
 * Los errores se silencian para no interrumpir operaciones principales.
 */
export async function registrarAuditoria(
  accion: AccionAuditoria,
  usuario: string,
  rol: string,
  entidad?: string | null,
  entidad_id?: number | null,
  detalles?: Record<string, any> | null
): Promise<void> {
  try {
    const db = getDbClient();
    await db.query(
      `INSERT INTO auditoria (accion, usuario, rol, entidad, entidad_id, detalles)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        accion,
        usuario,
        rol,
        entidad ?? null,
        entidad_id ?? null,
        detalles ? JSON.stringify(detalles) : null,
      ]
    );
  } catch {
    // Silencioso — los errores de auditoría no deben interrumpir la operación principal
  }
}
