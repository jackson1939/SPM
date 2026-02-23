// lib/serverUsers.ts — Lista de usuarios del LADO DEL SERVIDOR
// Este módulo NUNCA se bundlea al browser (no importar desde páginas/componentes).
// TODO (producción): migrar a tabla `usuarios` en BD con contraseñas PBKDF2/bcrypt.
import crypto from "crypto";

export type AppRole = "jefe" | "almacen" | "cajero";

interface User {
  username: string;
  passwordHash: string;
  salt: string;
  role: AppRole;
  nombre: string;
  activo: boolean;
}

function hashPassword(password: string, salt: string): string {
  // HMAC-SHA256 con salt por usuario → evita rainbow tables
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

// Salts únicos por usuario. Las contraseñas se hashean al cargar el módulo.
const USERS: User[] = [
  {
    username: "jefe",
    passwordHash: hashPassword("jefe123", "spm_salt_jefe_2026"),
    salt: "spm_salt_jefe_2026",
    role: "jefe",
    nombre: "Administrador",
    activo: true,
  },
  {
    username: "almacen",
    passwordHash: hashPassword("almacen123", "spm_salt_almacen_2026"),
    salt: "spm_salt_almacen_2026",
    role: "almacen",
    nombre: "Encargado Almacén",
    activo: true,
  },
  {
    username: "cajero",
    passwordHash: hashPassword("cajero123", "spm_salt_cajero_2026"),
    salt: "spm_salt_cajero_2026",
    role: "cajero",
    nombre: "Cajero",
    activo: true,
  },
  {
    username: "admin",
    passwordHash: hashPassword("admin123", "spm_salt_admin_2026"),
    salt: "spm_salt_admin_2026",
    role: "jefe",
    nombre: "Admin",
    activo: true,
  },
];

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
  // Comparación en tiempo constante
  if (
    hash.length !== user.passwordHash.length ||
    !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.passwordHash))
  ) {
    return null;
  }

  return { username: user.username, role: user.role, nombre: user.nombre, activo: user.activo };
}
