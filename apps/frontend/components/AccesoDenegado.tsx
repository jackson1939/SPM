// components/AccesoDenegado.tsx
// Pantalla mostrada cuando el usuario no tiene permisos para acceder a una página
import React from "react";
import { useRouter } from "next/router";
import { FaLock, FaArrowLeft, FaHome } from "react-icons/fa";

interface AccesoDenegadoProps {
  requiredRoles?: string[];
}

const ROLE_LABELS: Record<string, string> = {
  jefe: "Jefe / Administrador",
  almacen: "Encargado de Almacén",
  cajero: "Cajero",
};

export default function AccesoDenegado({ requiredRoles = [] }: AccesoDenegadoProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="text-center max-w-md w-full">
        {/* Icono */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 mb-6 shadow-lg">
          <FaLock className="text-4xl text-red-500 dark:text-red-400" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Acceso Denegado
        </h1>

        {/* Mensaje */}
        <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          No tienes permiso para ver esta página. Esta sección está restringida a usuarios con un rol específico.
        </p>

        {/* Roles requeridos */}
        {requiredRoles.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-left">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
              Roles con acceso:
            </p>
            <ul className="space-y-1">
              {requiredRoles.map((r) => (
                <li key={r} className="text-sm text-red-600 dark:text-red-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {ROLE_LABELS[r] ?? r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
          >
            <FaArrowLeft />
            Volver
          </button>
          <button
            onClick={() => router.replace("/dashboard")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all font-medium shadow-md"
          >
            <FaHome />
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
