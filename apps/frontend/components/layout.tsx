// apps/frontend/components/layout.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { formatPrecio } from "../utils/formatPrecio";
import { useSessionTimeout } from "../hooks/useSessionTimeout";
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
  FaStore,
  FaExclamationTriangle,
  FaCheckCircle,
  FaDollarSign,
  FaSync,
  FaSearch,
  FaBarcode,
  FaTag,
  FaKeyboard,
} from "react-icons/fa";

interface LayoutProps {
  children: React.ReactNode;
}

interface Notificacion {
  id: string;
  tipo: "error" | "warning" | "success" | "info";
  titulo: string;
  mensaje: string;
  tiempo: Date;
}

interface ProductoBusqueda {
  id: number;
  nombre: string;
  codigo_barras: string | null;
  precio: number;
  stock: number;
  categoria: string | null;
}

export default function Layout({ children }: LayoutProps) {
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Administrador");
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cargandoNotifs, setCargandoNotifs] = useState(false);

  // Búsqueda global ⌘K / Ctrl+K
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQ, setGlobalSearchQ] = useState("");
  const [allProducts, setAllProducts] = useState<ProductoBusqueda[]>([]);
  const [searchResults, setSearchResults] = useState<ProductoBusqueda[]>([]);
  const [selectedResultIdx, setSelectedResultIdx] = useState(0);
  const globalSearchInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  // Cierre de sesión automático tras 17 min de inactividad (excepto en login)
  useSessionTimeout();

  // Genera un ID único para cada notificación
  const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Carga notificaciones REALES desde las APIs
  const cargarNotificaciones = useCallback(async (userRole: string) => {
    setCargandoNotifs(true);
    const nuevas: Notificacion[] = [];

    try {
      // Leer umbral de stock bajo desde configuración
      let umbral = 5;
      try {
        const cfgRaw = localStorage.getItem("spm_config");
        if (cfgRaw) {
          const cfg = JSON.parse(cfgRaw);
          if (cfg.umbralStockBajo) umbral = Number(cfg.umbralStockBajo) || 5;
        }
      } catch {}

      // --- PRODUCTOS: alertas de stock ---
      const prodRes = await fetch("/api/productos").catch(() => null);
      if (prodRes?.ok) {
        const productos: any[] = await prodRes.json();
        const agotados = productos.filter((p) => Number(p.stock) === 0);
        const stockBajo = productos.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= umbral);

        agotados.slice(0, 3).forEach((p) => {
          nuevas.push({
            id: genId(),
            tipo: "error",
            titulo: "Producto agotado",
            mensaje: `"${p.nombre}" tiene 0 unidades en stock`,
            tiempo: new Date(),
          });
        });

        if (agotados.length > 3) {
          nuevas.push({
            id: genId(),
            tipo: "error",
            titulo: "Más productos agotados",
            mensaje: `${agotados.length - 3} productos más sin stock`,
            tiempo: new Date(),
          });
        }

        stockBajo.slice(0, 3).forEach((p) => {
          nuevas.push({
            id: genId(),
            tipo: "warning",
            titulo: "Stock bajo",
            mensaje: `"${p.nombre}" — solo ${p.stock} unidad${Number(p.stock) === 1 ? "" : "es"}`,
            tiempo: new Date(),
          });
        });

        if (stockBajo.length > 3) {
          nuevas.push({
            id: genId(),
            tipo: "warning",
            titulo: "Más productos con stock bajo",
            mensaje: `${stockBajo.length - 3} productos más con ≤${umbral} unidades`,
            tiempo: new Date(),
          });
        }
      }

      // --- VENTAS: resumen del día (para jefe y cajero) ---
      if (userRole === "jefe" || userRole === "cajero") {
        const ventasRes = await fetch("/api/ventas").catch(() => null);
        if (ventasRes?.ok) {
          const ventas: any[] = await ventasRes.json();
          // Usar fecha LOCAL para que coincida con la zona horaria del usuario
          const hoyD = new Date();
          const hoyStr = `${hoyD.getFullYear()}-${String(hoyD.getMonth() + 1).padStart(2, "0")}-${String(hoyD.getDate()).padStart(2, "0")}`;

          const ventasHoy = ventas.filter((v) => {
            const raw = v.fecha ?? v.fecha_iso ?? "";
            if (!raw) return false;
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw === hoyStr;
            const d = new Date(raw);
            if (isNaN(d.getTime())) return raw.split("T")[0] === hoyStr;
            const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            return local === hoyStr;
          });

          const totalHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total || 0), 0);
          const cantidadHoy = ventasHoy.reduce((acc, v) => acc + Number(v.cantidad || 0), 0);

          if (ventasHoy.length > 0) {
            nuevas.push({
              id: genId(),
              tipo: "success",
              titulo: "Ventas de hoy",
              mensaje: `${ventasHoy.length} transacción${ventasHoy.length !== 1 ? "es" : ""} · ${cantidadHoy} unidades · $${formatPrecio(totalHoy)}`,
              tiempo: new Date(),
            });
          } else {
            nuevas.push({
              id: genId(),
              tipo: "info",
              titulo: "Sin ventas hoy",
              mensaje: "Aún no se han registrado ventas en el día de hoy",
              tiempo: new Date(),
            });
          }
        }
      }

      // Si todo está bien y no hay alertas
      if (nuevas.length === 0) {
        nuevas.push({
          id: genId(),
          tipo: "success",
          titulo: "Todo en orden",
          mensaje: "No hay alertas pendientes. El inventario está al día.",
          tiempo: new Date(),
        });
      }
    } catch {
      // Si falla la carga, notificación genérica
      nuevas.push({
        id: genId(),
        tipo: "info",
        titulo: "Sistema activo",
        mensaje: "No se pudieron cargar las notificaciones del servidor",
        tiempo: new Date(),
      });
    } finally {
      setCargandoNotifs(false);
    }

    setNotifications(nuevas);
  }, []);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    if (!userRole) {
      router.push("/login");
    } else {
      setRole(userRole);
      cargarNotificaciones(userRole);
    }

    // Leer nombre de usuario desde configuración
    try {
      const raw = localStorage.getItem("spm_config");
      if (raw) {
        const cfg = JSON.parse(raw);
        if (cfg.username) setDisplayName(cfg.username);
      }
    } catch {}

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, [router, cargarNotificaciones]);

  // Atajo de teclado ⌘K / Ctrl+K para búsqueda global
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowGlobalSearch((prev) => !prev);
        setGlobalSearchQ("");
        setSearchResults([]);
        setSelectedResultIdx(0);
      }
      if (e.key === "Escape" && showGlobalSearch) {
        setShowGlobalSearch(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showGlobalSearch]);

  // Cargar productos cuando se abre el buscador
  useEffect(() => {
    if (showGlobalSearch) {
      setTimeout(() => globalSearchInputRef.current?.focus(), 50);
      if (allProducts.length === 0) {
        fetch("/api/productos")
          .then((r) => r.json())
          .then((data: any[]) =>
            setAllProducts(
              data.map((p) => ({
                id: p.id,
                nombre: p.nombre,
                codigo_barras: p.codigo_barras ?? null,
                precio: parseFloat(p.precio) || 0,
                stock: parseInt(p.stock) || 0,
                categoria: p.categoria ?? null,
              }))
            )
          )
          .catch(() => {});
      }
    }
  }, [showGlobalSearch, allProducts.length]);

  // Filtrar resultados en tiempo real
  useEffect(() => {
    if (!globalSearchQ.trim()) {
      setSearchResults([]);
      setSelectedResultIdx(0);
      return;
    }
    const q = globalSearchQ.toLowerCase();
    const results = allProducts
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.codigo_barras ?? "").toLowerCase().includes(q) ||
          (p.categoria ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8);
    setSearchResults(results);
    setSelectedResultIdx(0);
  }, [globalSearchQ, allProducts]);

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

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("role");
    localStorage.removeItem("spm_config");
    window.location.href = "/login";
  };

  // Tiempo relativo (hace X minutos / hora)
  const tiempoRelativo = (fecha: Date): string => {
    const diff = Math.floor((Date.now() - fecha.getTime()) / 1000);
    if (diff < 60) return "Ahora mismo";
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    return `Hace ${Math.floor(diff / 3600)}h`;
  };

  // Icono y color por tipo de notificación
  const getNotifStyle = (tipo: Notificacion["tipo"]) => {
    switch (tipo) {
      case "error":
        return {
          dot: "bg-red-500",
          icon: <FaTimes className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />,
          bg: "hover:bg-red-50 dark:hover:bg-red-900/10",
          badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
        };
      case "warning":
        return {
          dot: "bg-yellow-500",
          icon: <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />,
          bg: "hover:bg-yellow-50 dark:hover:bg-yellow-900/10",
          badge: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
        };
      case "success":
        return {
          dot: "bg-green-500",
          icon: <FaCheckCircle className="text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />,
          bg: "hover:bg-green-50 dark:hover:bg-green-900/10",
          badge: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
        };
      default:
        return {
          dot: "bg-blue-500",
          icon: <FaDollarSign className="text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />,
          bg: "hover:bg-blue-50 dark:hover:bg-blue-900/10",
          badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
        };
    }
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

  // Conteo de alertas críticas (error + warning) para el badge
  const alertasCriticas = notifications.filter(
    (n) => n.tipo === "error" || n.tipo === "warning"
  ).length;
  const badgeCount = alertasCriticas > 0 ? alertasCriticas : notifications.length;

  return (
    <div className={`flex min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">

        {/* Sidebar */}
        <aside
          className={`${sidebarCollapsed ? "w-20" : "w-72"} bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 dark:from-gray-950 dark:via-black dark:to-gray-950 text-white flex flex-col shadow-2xl transition-all duration-300 relative border-r border-white/5`}
        >
          {/* Header del Sidebar */}
          <div className="p-6 border-b border-white/10 relative">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-8 w-6 h-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10"
            >
              <FaChevronRight
                className={`text-xs text-white transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </button>
            <div className="flex items-center gap-3">
              <div
                className={`${sidebarCollapsed ? "w-10 h-10" : "w-14 h-14"} rounded-2xl bg-gradient-to-r ${roleInfo.color} flex items-center justify-center shadow-lg transition-all duration-300`}
              >
                <span className="text-2xl">{roleInfo.icon}</span>
              </div>
              {!sidebarCollapsed && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    SPM
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/60">Sistema POS</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          {!sidebarCollapsed && (
            <div className="mx-4 mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shadow-lg">
                  <FaUser className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
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
                        ? "bg-white/10 shadow-lg border border-white/20"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                        isActive
                          ? `bg-gradient-to-br from-${item.color}-400 to-${item.color}-600 shadow-lg`
                          : "bg-white/5 group-hover:bg-white/10"
                      }`}
                    >
                      <Icon
                        className={`text-lg ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`}
                      />
                    </div>
                    {!sidebarCollapsed && (
                      <span
                        className={`font-medium transition-colors duration-200 ${
                          isActive ? "text-white" : "text-white/70 group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                    {isActive && !sidebarCollapsed && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            {!sidebarCollapsed ? (
              <div className="space-y-2 animate-fadeIn">
                {role === "jefe" && (
                  <Link href="/configuracion">
                    <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200 group cursor-pointer ${router.pathname === "/configuracion" ? "bg-white/10 border border-white/20" : ""}`}>
                      <FaCog className="text-white/60 group-hover:text-white transition-colors" />
                      <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                        Configuración
                      </span>
                    </div>
                  </Link>
                )}
                <div className="text-xs text-white/40 text-center pt-2">
                  <p>© 2026 VEROKAI</p>
                  <p className="mt-0.5">v1.0.0</p>
                </div>
              </div>
            ) : (
              role === "jefe" && (
                <Link href="/configuracion">
                  <div className="w-full flex justify-center py-3 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer">
                    <FaCog className="text-white/60 hover:text-white transition-colors" />
                  </div>
                </Link>
              )
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">

          {/* Header */}
          <header className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 transition-colors duration-300">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Panel Administrativo
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date().toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Búsqueda global ⌘K */}
                  <button
                    onClick={() => {
                      setShowGlobalSearch(true);
                      setGlobalSearchQ("");
                      setSearchResults([]);
                    }}
                    className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm group"
                    title="Búsqueda global (⌘K)"
                  >
                    <FaSearch className="text-sm" />
                    <span className="hidden lg:inline">Buscar producto...</span>
                    <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-500 dark:text-gray-400">
                      ⌘K
                    </kbd>
                  </button>

                  {/* Dark Mode */}
                  <button
                    onClick={toggleDarkMode}
                    className="relative p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 group overflow-hidden"
                    title={darkMode ? "Modo Claro" : "Modo Oscuro"}
                  >
                    {darkMode ? (
                      <FaSun className="text-xl text-yellow-500" />
                    ) : (
                      <FaMoon className="text-xl text-blue-600" />
                    )}
                  </button>

                  {/* Notificaciones */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowUserMenu(false);
                        // Si no hay notificaciones, cargar al abrir
                        if (!showNotifications && role) {
                          cargarNotificaciones(role);
                        }
                      }}
                      className="relative p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      <FaBell className="text-xl text-gray-700 dark:text-gray-200" />
                      {badgeCount > 0 && (
                        <span
                          className={`absolute -top-1 -right-1 w-6 h-6 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse ${
                            alertasCriticas > 0
                              ? "bg-gradient-to-r from-red-500 to-pink-600"
                              : "bg-gradient-to-r from-blue-500 to-blue-600"
                          }`}
                        >
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </span>
                      )}
                    </button>

                    {/* Dropdown notificaciones */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-3 w-[420px] bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideDown z-50">
                        {/* Header del panel */}
                        <div className="p-5 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 dark:from-blue-800 dark:via-blue-900 dark:to-purple-900">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <FaBell className="text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-lg">Notificaciones</h3>
                                <p className="text-xs text-white/70">
                                  {alertasCriticas > 0
                                    ? `${alertasCriticas} alerta${alertasCriticas !== 1 ? "s" : ""} crítica${alertasCriticas !== 1 ? "s" : ""}`
                                    : `${notifications.length} notificación${notifications.length !== 1 ? "es" : ""}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => role && cargarNotificaciones(role)}
                                disabled={cargandoNotifs}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Actualizar"
                              >
                                <FaSync className={`text-white text-sm ${cargandoNotifs ? "animate-spin" : ""}`} />
                              </button>
                              <button
                                onClick={() => setShowNotifications(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <FaTimes className="text-white" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Lista */}
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                          {cargandoNotifs ? (
                            <div className="p-8 text-center">
                              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                              <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando alertas...</p>
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                                <FaBell className="text-3xl text-gray-300 dark:text-gray-600" />
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 font-medium">Sin notificaciones</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Todo está al día</p>
                            </div>
                          ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                              {notifications.map((n) => {
                                const style = getNotifStyle(n.tipo);
                                return (
                                  <li
                                    key={n.id}
                                    className={`p-4 ${style.bg} transition-colors duration-150 group`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="mt-0.5">{style.icon}</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                            {n.titulo}
                                          </p>
                                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${style.badge}`}>
                                            {n.tipo === "error" ? "Urgente" : n.tipo === "warning" ? "Aviso" : n.tipo === "success" ? "OK" : "Info"}
                                          </span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                          {n.mensaje}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                          {tiempoRelativo(n.tiempo)}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeNotification(n.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg flex-shrink-0"
                                        title="Descartar"
                                      >
                                        <FaTimes className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-xs" />
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

                        {/* Footer del panel */}
                        {notifications.length > 0 && !cargandoNotifs && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                            <button
                              onClick={() => setNotifications([])}
                              className="flex-1 text-sm text-red-500 dark:text-red-400 hover:text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              Limpiar todas
                            </button>
                            <button
                              onClick={() => role && cargarNotificaciones(role)}
                              disabled={cargandoNotifs}
                              className="flex-1 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                            >
                              <FaSync className={cargandoNotifs ? "animate-spin" : ""} />
                              Actualizar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowUserMenu(!showUserMenu);
                        setShowNotifications(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200 border border-gray-300 dark:border-gray-600"
                    >
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-r ${roleInfo.color} flex items-center justify-center shadow-lg`}
                      >
                        <span className="text-sm">{roleInfo.icon}</span>
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                        {roleInfo.name}
                      </span>
                      <FaChevronRight
                        className={`text-gray-500 dark:text-gray-400 text-xs transition-transform ${showUserMenu ? "rotate-90" : ""}`}
                      />
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideDown z-50">
                        <div className={`p-4 bg-gradient-to-r ${roleInfo.color}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <span className="text-2xl">{roleInfo.icon}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{displayName}</p>
                              <p className="text-xs text-white/80 capitalize">{roleInfo.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          {role === "jefe" && (
                            <Link href="/configuracion">
                              <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left cursor-pointer" onClick={() => setShowUserMenu(false)}>
                                <FaCog className="text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300 text-sm">Configuración</span>
                              </div>
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group"
                          >
                            <FaSignOutAlt className="text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                            <span className="text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 text-sm font-medium">
                              Cerrar sesión
                            </span>
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
            <div className="max-w-full mx-auto">{children}</div>
          </main>
        </div>
      </div>

      {/* Overlay para cerrar dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}

      {/* Modal de Búsqueda Global ⌘K */}
      {showGlobalSearch && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowGlobalSearch(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideDown">
            {/* Barra de búsqueda */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <FaSearch className="text-gray-400 dark:text-gray-500 flex-shrink-0 text-lg" />
              <input
                ref={globalSearchInputRef}
                type="text"
                placeholder="Buscar producto por nombre, código o categoría..."
                value={globalSearchQ}
                onChange={(e) => setGlobalSearchQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedResultIdx((i) => Math.min(i + 1, searchResults.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedResultIdx((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && searchResults[selectedResultIdx]) {
                    router.push("/productos");
                    setShowGlobalSearch(false);
                  } else if (e.key === "Escape") {
                    setShowGlobalSearch(false);
                  }
                }}
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white text-base placeholder-gray-400 dark:placeholder-gray-500"
                autoComplete="off"
                spellCheck={false}
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-500 dark:text-gray-400">
                  Esc
                </kbd>
              </div>
            </div>

            {/* Resultados */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {!globalSearchQ.trim() ? (
                <div className="p-6 text-center">
                  <FaKeyboard className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Escribe para buscar productos
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Busca por nombre, código de barras o categoría
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center">
                  <FaSearch className="text-3xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No se encontraron productos
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Prueba con otro término de búsqueda
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {searchResults.map((p, idx) => (
                    <li key={p.id}>
                      <Link href="/productos">
                        <div
                          onClick={() => setShowGlobalSearch(false)}
                          className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                            idx === selectedResultIdx
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                          onMouseEnter={() => setSelectedResultIdx(idx)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {p.nombre}
                              </p>
                              {p.categoria && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs font-medium flex-shrink-0">
                                  <FaTag className="text-xs" />
                                  {p.categoria}
                                </span>
                              )}
                            </div>
                            {p.codigo_barras && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                                <FaBarcode className="text-xs" />
                                {p.codigo_barras}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              ${formatPrecio(p.precio)}
                            </p>
                            <p className={`text-xs font-medium ${
                              p.stock === 0
                                ? "text-red-500"
                                : p.stock <= 5
                                ? "text-yellow-500"
                                : "text-green-500"
                            }`}>
                              Stock: {p.stock}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer del buscador */}
            {searchResults.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono">↑↓</kbd>
                    Navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono">↵</kbd>
                    Ir a Productos
                  </span>
                </div>
                <span>{searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
