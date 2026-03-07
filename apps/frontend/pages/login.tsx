// apps/frontend/pages/login.tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { FaUser, FaLock, FaUserTie, FaWarehouse, FaCashRegister, FaSignInAlt, FaSun, FaMoon } from "react-icons/fa";

// Roles informativos (no rellenan usuario/contraseña por seguridad)
const ROLES_INFO: Record<string, { username: string; label: string }> = {
  jefe:    { username: "jefe",    label: "Jefe / Administrador" },
  almacen: { username: "almacen", label: "Compras / Almacén" },
  cajero:  { username: "cajero", label: "Cajero" },
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  const isTimeout = typeof window !== "undefined" && router.query.timeout === "1";

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Si ya hay sesión válida en el servidor, redirigir al dashboard
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => {
        if (r.ok) {
          const redirect = (router.query.redirect as string) || "/dashboard";
          const safePath = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/dashboard";
          router.replace(safePath);
        }
      })
      .catch(() => {}); // Sin sesión o error de red — mostrar login normalmente
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Usuario o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      // Guardar rol en localStorage solo para uso de UI (la sesión real es la cookie httpOnly)
      localStorage.setItem("role", data.role);

      // Actualizar nombre visible en la configuración
      try {
        const raw = localStorage.getItem("spm_config");
        const cfg = raw ? JSON.parse(raw) : {};
        cfg.username = data.nombre; // Siempre sincronizar nombre
        localStorage.setItem("spm_config", JSON.stringify(cfg));
      } catch {}

      // Redirigir a la página original o al dashboard
      const redirect = (router.query.redirect as string) || "/dashboard";
      const safePath = redirect.startsWith("/") ? redirect : "/dashboard";
      router.push(safePath);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
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



  return (
    <>
      <Head>
        <title>Login - KIOSKO ROJO</title>
      </Head>
      <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 transition-colors duration-300">
        {/* Toggle tema */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
            title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {darkMode ? (
              <FaSun className="text-yellow-500 text-lg" />
            ) : (
              <FaMoon className="text-gray-700 text-lg" />
            )}
          </button>
        </div>

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
              KIOSKO ROJO
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestor De Almacen
            </p>
          </div>

          {/* Tarjeta de login */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 animate-fadeIn">
            {/* Sesión expirada por inactividad */}
            {isTimeout && !error && (
              <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                <FaLock className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">Sesión cerrada por inactividad (más de 17 min). Inicia sesión de nuevo.</p>
              </div>
            )}
            {/* Error */}
            {error && (
              <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <FaLock className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tarjetas de roles informativos (no rellenan credenciales) */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Roles del sistema</p>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const info = ROLES_INFO[r.value];
                    return (
                      <div
                        key={r.value}
                        title={`Usuario: ${info?.username ?? r.value}`}
                        className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-left cursor-default"
                      >
                        <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${r.color} mb-2`}>
                          <Icon className="text-white text-sm" />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{r.label}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{info?.username ?? r.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

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
                    onChange={(e) => { setUsername(e.target.value); setError(null); }}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm"
                    placeholder="jefe / almacen / cajero"
                    autoComplete="off"
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
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm"
                    placeholder="********"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              {/* Botón de login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-[1.02] text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                © 2026 ALLDRIX FOUNDRY - Gestor de Almacen
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