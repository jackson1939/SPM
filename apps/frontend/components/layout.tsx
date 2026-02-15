// apps/frontend/components/layout.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  FaBell, 
  FaBox, 
  FaShoppingCart, 
  FaClipboardList, 
  FaChartBar, 
  FaHome,
  FaMoon,
  FaSun,
  FaUser,
  FaTimes
} from "react-icons/fa";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [role, setRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    if (!userRole) {
      router.push("/login");
    } else {
      setRole(userRole);

      // Simulación de notificaciones según rol
      if (userRole === "jefe") {
        setNotifications([
          "Stock bajo en Leche (2 unidades)",
          "Ventas de hoy: $45",
          "Compra pendiente de autorización",
        ]);
      } else if (userRole === "almacen") {
        setNotifications(["Stock bajo en Coca Cola (1 unidad)"]);
      } else if (userRole === "cajero") {
        setNotifications(["Venta registrada correctamente"]);
      }
    }

    // Cargar preferencia de tema
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, [router]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const removeNotification = (index: number) => {
    setNotifications(notifications.filter((_, i) => i !== index));
  };

  const renderLinks = () => {
    const linkClass = "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-white/10 hover:translate-x-1";
    const activeLinkClass = "bg-white/20 shadow-lg";

    switch (role) {
      case "jefe":
        return (
          <>
            <Link href="/dashboard">
              <div className={`${linkClass} ${router.pathname === "/dashboard" ? activeLinkClass : ""}`}>
                <FaHome className="text-xl" />
                <span className="font-medium">Dashboard</span>
              </div>
            </Link>
            <Link href="/productos">
              <div className={`${linkClass} ${router.pathname === "/productos" ? activeLinkClass : ""}`}>
                <FaBox className="text-xl" />
                <span className="font-medium">Productos</span>
              </div>
            </Link>
            <Link href="/ventas">
              <div className={`${linkClass} ${router.pathname === "/ventas" ? activeLinkClass : ""}`}>
                <FaShoppingCart className="text-xl" />
                <span className="font-medium">Ventas</span>
              </div>
            </Link>
            <Link href="/compras">
              <div className={`${linkClass} ${router.pathname === "/compras" ? activeLinkClass : ""}`}>
                <FaClipboardList className="text-xl" />
                <span className="font-medium">Compras</span>
              </div>
            </Link>
            <Link href="/reportes">
              <div className={`${linkClass} ${router.pathname === "/reportes" ? activeLinkClass : ""}`}>
                <FaChartBar className="text-xl" />
                <span className="font-medium">Reportes</span>
              </div>
            </Link>
          </>
        );
      case "almacen":
        return (
          <>
            <Link href="/dashboard">
              <div className={`${linkClass} ${router.pathname === "/dashboard" ? activeLinkClass : ""}`}>
                <FaHome className="text-xl" />
                <span className="font-medium">Dashboard</span>
              </div>
            </Link>
            <Link href="/compras">
              <div className={`${linkClass} ${router.pathname === "/compras" ? activeLinkClass : ""}`}>
                <FaClipboardList className="text-xl" />
                <span className="font-medium">Compras</span>
              </div>
            </Link>
          </>
        );
      case "cajero":
        return (
          <>
            <Link href="/dashboard">
              <div className={`${linkClass} ${router.pathname === "/dashboard" ? activeLinkClass : ""}`}>
                <FaHome className="text-xl" />
                <span className="font-medium">Dashboard</span>
              </div>
            </Link>
            <Link href="/ventas">
              <div className={`${linkClass} ${router.pathname === "/ventas" ? activeLinkClass : ""}`}>
                <FaShoppingCart className="text-xl" />
                <span className="font-medium">Ventas</span>
              </div>
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Sidebar */}
        <aside className="w-72 bg-gradient-to-b from-blue-600 to-blue-800 dark:from-gray-800 dark:to-gray-900 text-white flex flex-col shadow-2xl">
          {/* Logo y perfil */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <FaUser className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">SPM</h2>
                <p className="text-xs text-white/70 capitalize">{role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col gap-2 p-4">
            {renderLinks()}
          </nav>

          {/* Footer con info del usuario */}
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-white/60 text-center">
              <p>Sistema de Punto de Venta</p>
              <p className="mt-1">© 2026 VEROKAI</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header con glassmorphism */}
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-50 transition-colors duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Panel Administrativo
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bienvenido de nuevo, administrador
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Toggle Dark Mode */}
                <button
                  onClick={toggleDarkMode}
                  className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-gray-700 dark:text-gray-200"
                  title={darkMode ? "Modo Claro" : "Modo Oscuro"}
                >
                  {darkMode ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
                </button>

                {/* Notificaciones */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-gray-700 dark:text-gray-200 relative"
                  >
                    <FaBell className="text-xl" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Dropdown de notificaciones animado */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeIn z-50">
                      <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-gray-700 dark:to-gray-800">
                        <h3 className="font-bold text-white text-lg">Notificaciones</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center">
                            <FaBell className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">No hay notificaciones</p>
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {notifications.map((n, i) => (
                              <li 
                                key={i} 
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 flex items-start gap-3 group"
                              >
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                <p className="text-gray-700 dark:text-gray-300 flex-1 text-sm">{n}</p>
                                <button
                                  onClick={() => removeNotification(i)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                >
                                  <FaTimes />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => setNotifications([])}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium w-full text-center"
                          >
                            Limpiar todas
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Botón cerrar sesión */}
                <button
                  onClick={() => {
                    localStorage.removeItem("role");
                    localStorage.removeItem("theme");
                    window.location.href = "/login";
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {children}
          </main>
        </div>
      </div>

      {/* Overlay para cerrar notificaciones */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        ></div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
