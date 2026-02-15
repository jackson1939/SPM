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
  FaTimes,
  FaSignOutAlt,
  FaCog,
  FaChevronRight,
  FaBars,
  FaStore
} from "react-icons/fa";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [role, setRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
          "Ventas de hoy: $45,000",
          "Compra pendiente de autorización",
          "3 productos requieren reposición",
        ]);
      } else if (userRole === "almacen") {
        setNotifications([
          "Stock bajo en Coca Cola (1 unidad)",
          "Nueva orden de compra disponible"
        ]);
      } else if (userRole === "cajero") {
        setNotifications([
          "Venta registrada correctamente",
          "Turno iniciado: 09:00 AM"
        ]);
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

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("theme");
    window.location.href = "/login";
  };

  const getRoleInfo = () => {
    switch (role) {
      case "jefe":
        return { name: "Administrador", color: "from-blue-500 to-blue-600", icon: "👔" };
      case "almacen":
        return { name: "Almacén", color: "from-purple-500 to-purple-600", icon: "📦" };
      case "cajero":
        return { name: "Cajero", color: "from-green-500 to-green-600", icon: "💰" };
      default:
        return { name: "Usuario", color: "from-gray-500 to-gray-600", icon: "👤" };
    }
  };

  const roleInfo = getRoleInfo();

  const menuItems = {
    jefe: [
      { href: "/dashboard", icon: FaHome, label: "Dashboard", color: "blue" },
      { href: "/productos", icon: FaBox, label: "Productos", color: "indigo" },
      { href: "/ventas", icon: FaShoppingCart, label: "Ventas", color: "green" },
      { href: "/compras", icon: FaClipboardList, label: "Compras", color: "yellow" },
      { href: "/reportes", icon: FaChartBar, label: "Reportes", color: "purple" },
    ],
    almacen: [
      { href: "/dashboard", icon: FaHome, label: "Dashboard", color: "blue" },
      { href: "/compras", icon: FaClipboardList, label: "Compras", color: "yellow" },
    ],
    cajero: [
      { href: "/dashboard", icon: FaHome, label: "Dashboard", color: "blue" },
      { href: "/ventas", icon: FaShoppingCart, label: "Ventas", color: "green" },
    ],
  };

  const currentMenuItems = role ? menuItems[role as keyof typeof menuItems] : [];

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
        
        {/* Sidebar Premium */}
        <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 dark:from-gray-950 dark:via-black dark:to-gray-950 text-white flex flex-col shadow-2xl transition-all duration-300 relative border-r border-white/5`}>
          
          {/* Header del Sidebar con Logo */}
          <div className="p-6 border-b border-white/10 relative">
            {/* Botón collapse */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-8 w-6 h-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10"
            >
              <FaChevronRight className={`text-xs text-white transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>

            <div className="flex items-center gap-3">
              {/* Logo/Avatar */}
              <div className={`${sidebarCollapsed ? 'w-10 h-10' : 'w-14 h-14'} rounded-2xl bg-gradient-to-r ${roleInfo.color} flex items-center justify-center backdrop-blur-sm shadow-lg transition-all duration-300`}>
                <span className="text-2xl">{roleInfo.icon}</span>
              </div>
              
              {!sidebarCollapsed && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    SPM
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/60">Sistema POS</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Info Card */}
          {!sidebarCollapsed && (
            <div className="mx-4 mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shadow-lg">
                  <FaUser className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">Usuario Admin</p>
                  <p className="text-xs text-white/60 capitalize">{roleInfo.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {currentMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white/10 shadow-lg border border-white/20'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-br from-${item.color}-400 to-${item.color}-600 shadow-lg`
                        : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      <Icon className={`text-lg ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                    </div>
                    
                    {!sidebarCollapsed && (
                      <span className={`font-medium transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                      }`}>
                        {item.label}
                      </span>
                    )}

                    {isActive && !sidebarCollapsed && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer del Sidebar */}
          <div className="p-4 border-t border-white/10">
            {!sidebarCollapsed ? (
              <div className="space-y-2 animate-fadeIn">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200 group">
                  <FaCog className="text-white/60 group-hover:text-white transition-colors" />
                  <span className="text-sm text-white/70 group-hover:text-white transition-colors">Configuración</span>
                </button>
                <div className="text-xs text-white/40 text-center pt-2">
                  <p>© 2026 VEROKAI</p>
                  <p className="mt-0.5">v1.0.0</p>
                </div>
              </div>
            ) : (
              <button className="w-full flex justify-center py-3 rounded-xl hover:bg-white/5 transition-all duration-200">
                <FaCog className="text-white/60 hover:text-white transition-colors" />
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          
          {/* Header Premium */}
          <header className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 transition-colors duration-300">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                
                {/* Left Section */}
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Panel Administrativo
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center gap-3">
                  
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={toggleDarkMode}
                    className="relative p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 group overflow-hidden"
                    title={darkMode ? "Modo Claro" : "Modo Oscuro"}
                  >
                    <div className="relative z-10">
                      {darkMode ? (
                        <FaSun className="text-xl text-yellow-500" />
                      ) : (
                        <FaMoon className="text-xl text-blue-600" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 to-blue-600/0 group-hover:from-yellow-400/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
                  </button>

                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      <FaBell className="text-xl text-gray-700 dark:text-gray-200" />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                          {notifications.length}
                        </span>
                      )}
                    </button>

                    {/* Dropdown de notificaciones mejorado */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideDown z-50">
                        <div className="p-5 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 dark:from-blue-800 dark:via-blue-900 dark:to-purple-900">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <FaBell className="text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-lg">Notificaciones</h3>
                                <p className="text-xs text-white/70">{notifications.length} sin leer</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowNotifications(false)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <FaTimes className="text-white" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                                <FaBell className="text-3xl text-gray-300 dark:text-gray-600" />
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 font-medium">No hay notificaciones</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Estás al día</p>
                            </div>
                          ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                              {notifications.map((n, i) => (
                                <li 
                                  key={i} 
                                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 group cursor-pointer"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0 animate-pulse"></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{n}</p>
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Hace 5 minutos</p>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeNotification(i);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                    >
                                      <FaTimes className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-sm" />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        
                        {notifications.length > 0 && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                            <button
                              onClick={() => setNotifications([])}
                              className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              Limpiar todas
                            </button>
                            <button className="flex-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                              Ver todas
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200 border border-gray-300 dark:border-gray-600"
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${roleInfo.color} flex items-center justify-center shadow-lg`}>
                        <span className="text-sm">{roleInfo.icon}</span>
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{roleInfo.name}</span>
                      <FaChevronRight className={`text-gray-500 dark:text-gray-400 text-xs transition-transform ${showUserMenu ? 'rotate-90' : ''}`} />
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideDown z-50">
                        <div className={`p-4 bg-gradient-to-r ${roleInfo.color}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <span className="text-2xl">{roleInfo.icon}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">Usuario Admin</p>
                              <p className="text-xs text-white/80 capitalize">{roleInfo.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                            <FaCog className="text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">Configuración</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group"
                          >
                            <FaSignOutAlt className="text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                            <span className="text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 text-sm font-medium">Cerrar sesión</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Overlays */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
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

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}