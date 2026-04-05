// lib/serverUsers.ts — Lista de usuarios del LADO DEL SERVIDOR
// Este módulo NUNCA se bundlea al browser (no importar desde páginas/componentes).
// Contraseñas: solo hashes en código; opcionalmente usuarios extra vía SPM_APP_USERS_JSON (solo en .env, nunca en git).
import crypto from "crypto";
import type { AppRole } from "./apiAuth";

interface User {
  username: string;
  passwordHash: string;
  salt: string;
  role: AppRole;
  nombre: string;
  activo: boolean;
}

function hashPassword(password: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

/** Usuarios por defecto (solo hash + salt; sin contraseñas en texto plano en el repo). */
const BUILTIN_USERS: User[] = [
  {
    username: "jefe",
    passwordHash:
      "68fc299a3a489c9f749665f0aa9cbcb43010a94af08edb4fce3111e0b93a7cc7",
    salt: "spm_salt_jefe_2026",
    role: "jefe",
    nombre: "Administrador",
    activo: true,
  },
  {
    username: "almacen",
    passwordHash:
      "50a5ca74d7a9770032f6830cac2ee0b26a4e91ab2748e0917811b35fd2c6f2f0",
    salt: "spm_salt_almacen_2026",
    role: "almacen",
    nombre: "Encargado Almacén",
    activo: true,
  },
  {
    username: "cajero",
    passwordHash:
      "b6581e9f23f25ce82f9537a684bca9bc13b9950c164acb564c6338fc3062f475",
    salt: "spm_salt_cajero_2026",
    role: "cajero",
    nombre: "Cajero",
    activo: true,
  },
  {
    username: "admin",
    passwordHash:
      "a1b706c8588228af3a5ebb7fd16537ea568db851148234eaecd153def491920c",
    salt: "spm_salt_admin_2026",
    role: "jefe",
    nombre: "Admin",
    activo: true,
  },
];

function parseEnvUsers(): User[] {
  const raw = process.env.SPM_APP_USERS_JSON?.trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[serverUsers] SPM_APP_USERS_JSON no es JSON válido");
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error("[serverUsers] SPM_APP_USERS_JSON debe ser un array");
    return [];
  }

  const roles: AppRole[] = ["jefe", "almacen", "cajero"];
  const out: User[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const u = item as Record<string, unknown>;
    const username = typeof u.username === "string" ? u.username.trim() : "";
    const password = typeof u.password === "string" ? u.password : "";
    const role = u.role as AppRole;
    const nombre = typeof u.nombre === "string" ? u.nombre : username;
    const activo = u.activo === false ? false : true;

    if (!username || !password || !roles.includes(role)) continue;

    const salt = `spm_env_${username}`;
    out.push({
      username,
      passwordHash: hashPassword(password, salt),
      salt,
      role,
      nombre,
      activo,
    });
  }

  return out;
}

function mergeUsers(builtin: User[], fromEnv: User[]): User[] {
  const byName = new Map<string, User>();
  for (const u of builtin) {
    byName.set(u.username.toLowerCase(), u);
  }
  for (const u of fromEnv) {
    byName.set(u.username.toLowerCase(), u);
  }
  return [...byName.values()];
}

const USERS: User[] = mergeUsers(BUILTIN_USERS, parseEnvUsers());

export type PublicUser = Omit<User, "passwordHash" | "salt">;

export function validateCredentials(
  username: string,
  password: string
): PublicUser | null {
  const user = USERS.find(
    (u) => u.activo && u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (!user) return null;

  const hash = hashPassword(password, user.salt);
  if (
    hash.length !== user.passwordHash.length ||
    !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.passwordHash))
  ) {
    return null;
  }

  return {
    username: user.username,
    role: user.role,
    nombre: user.nombre,
    activo: user.activo,
  };
}
