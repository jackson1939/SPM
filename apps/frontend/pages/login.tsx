// apps/frontend/pages/login.tsx
import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { FaUser, FaLock, FaUserTie, FaWarehouse, FaCashRegister, FaSignInAlt } from "react-icons/fa";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cajero");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulación de validación
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Guardamos el rol en localStorage
    localStorage.setItem("role", role);
    
    setLoading(false);
    router.push("/dashboard");
  };

  const roles = [
    {
      value: "jefe",
      label: "Jefe / Administrador",
      icon: FaUserTie,
      color: "from-blue-500 to-blue-600",
      description: "Acceso completo al sistema",
    },
    {
      value: "almacen",
      label: "Encargado de Almacén",
      icon: FaWarehouse,
      color: "from-purple-500 to-purple-600",
      description: "Gestión de inventario y compras",
    },
    {
      value: "cajero",
      label: "Cajero",
      icon: FaCashRegister,
      color: "from-green-500 to-green-600",
      description: "Punto de venta",
    },
  ];

  const selectedRole = roles.find((r) => r.value === role);

  return (
    <>
      <Head>
        <title>Login - VEROKAI POS</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        {/* Formas decorativas de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo y título */}
          <div className="text-center mb-8 animate-fadeIn">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl mb-4">
              <FaSignInAlt className="text-white text-4xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              VEROKAI POS
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sistema de Punto de Venta
            </p>
          </div>

          {/* Tarjeta de login */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 animate-fadeIn">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Usuario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm"
                    placeholder="Ingrese su usuario"
                    required
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm"
                    placeholder="********"
                    required
                  />
                </div>
              </div>

              {/* Selección de rol */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Rol de Usuario
                </label>
                <div className="space-y-2">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.value;
                    
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 rounded-lg bg-gradient-to-r ${r.color} ${
                              isSelected ? "shadow-lg" : "opacity-60"
                            }`}
                          >
                            <Icon className="text-white text-xl" />
                          </div>
                          <div className="flex-1">
                            <p
                              className={`font-semibold ${
                                isSelected
                                  ? "text-blue-700 dark:text-blue-400"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {r.label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {r.description}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 dark:bg-blue-400 flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón de login */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 ${
                  selectedRole
                    ? `bg-gradient-to-r ${selectedRole.color} hover:shadow-xl hover:scale-[1.02] text-white`
                    : "bg-gray-400 dark:bg-gray-600 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaSignInAlt />
                    Iniciar Sesión
                  </div>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                © 2026 VEROKAI POS - Sistema de Punto de Venta
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-6 text-center animate-fadeIn">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Necesitas ayuda? Contacta al administrador del sistema
            </p>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </>
  );
}