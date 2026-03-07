// apps/frontend/pages/configuracion.tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  FaArrowLeft,
  FaSave,
  FaStore,
  FaUser,
  FaLock,
  FaBox,
  FaDollarSign,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaPhone,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaInfoCircle,
  FaSignOutAlt,
  FaPrint,
  FaTrash,
} from "react-icons/fa";
import { useRoleGuard } from "../hooks/useRoleGuard";
import AccesoDenegado from "../components/AccesoDenegado";

interface SpmConfig {
  nombreTienda: string;
  direccion: string;
  telefono: string;
  simboloMoneda: string;
  umbralStockBajo: number;
  username: string;
  pin: string;
  impresora: string;
  footerTicket: string;
}

const DEFAULT_CONFIG: SpmConfig = {
  nombreTienda: "VEROKAI POS",
  direccion: "",
  telefono: "",
  simboloMoneda: "$",
  umbralStockBajo: 5,
  username: "Administrador",
  pin: "",
  impresora: "",
  footerTicket: "¡Gracias por su compra! Vuelva pronto",
};

const CONFIG_KEY = "spm_config";

function loadConfig(): SpmConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(cfg: SpmConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export default function ConfiguracionPage() {
  const { authorized, loading: guardLoading } = useRoleGuard(["jefe"]);
  const [config, setConfig] = useState<SpmConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("tienda");

  // Tienda
  const [nombreTienda, setNombreTienda] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [footerTicket, setFooterTicket] = useState("");

  // Cuenta
  const [username, setUsername] = useState("");
  const [pinActual, setPinActual] = useState("");
  const [pinNuevo, setPinNuevo] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Inventario
  const [simboloMoneda, setSimboloMoneda] = useState("$");
  const [umbralStockBajo, setUmbralStockBajo] = useState(5);

  // Rol
  const [role, setRole] = useState<string | null>(null);

  // Borrar base de datos
  const [confirmarBorrado, setConfirmarBorrado] = useState("");
  const [borrandoDb, setBorrandoDb] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);

  useEffect(() => {
    const cfg = loadConfig();
    setConfig(cfg);
    setNombreTienda(cfg.nombreTienda);
    setDireccion(cfg.direccion);
    setTelefono(cfg.telefono);
    setFooterTicket(cfg.footerTicket);
    setUsername(cfg.username);
    setSimboloMoneda(cfg.simboloMoneda);
    setUmbralStockBajo(cfg.umbralStockBajo);
    setRole(localStorage.getItem("role"));
  }, []);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveTienda = () => {
    const updated = {
      ...config,
      nombreTienda: nombreTienda.trim() || DEFAULT_CONFIG.nombreTienda,
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      footerTicket: footerTicket.trim() || DEFAULT_CONFIG.footerTicket,
    };
    saveConfig(updated);
    setConfig(updated);
    showSaved();
  };

  const handleSaveCuenta = () => {
    setPinError(null);
    if (pinNuevo) {
      if (config.pin && pinActual !== config.pin) {
        setPinError("El PIN actual no coincide");
        return;
      }
      if (pinNuevo.length < 4) {
        setPinError("El PIN debe tener al menos 4 caracteres");
        return;
      }
      if (pinNuevo !== pinConfirm) {
        setPinError("Los PINs no coinciden");
        return;
      }
    }
    const updated = {
      ...config,
      username: username.trim() || DEFAULT_CONFIG.username,
      pin: pinNuevo || config.pin,
    };
    saveConfig(updated);
    setConfig(updated);
    setPinActual("");
    setPinNuevo("");
    setPinConfirm("");
    showSaved();
  };

  const handleSaveInventario = () => {
    const updated = {
      ...config,
      simboloMoneda: simboloMoneda.trim() || "$",
      umbralStockBajo: Math.max(1, Math.min(50, umbralStockBajo)),
    };
    saveConfig(updated);
    setConfig(updated);
    showSaved();
  };

  const handleClearSession = () => {
    if (confirm("¿Cerrar sesión y volver al inicio de sesión?")) {
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
  };

  const handleBorrarBaseDatos = async () => {
    if (confirmarBorrado !== "BORRAR TODO") {
      setErrorBorrado("Escribe exactamente BORRAR TODO para confirmar.");
      return;
    }
    if (!confirm("¿Estás seguro? Se eliminarán TODOS los productos, ventas, compras e historial. Esta acción no se puede deshacer.")) {
      return;
    }
    setErrorBorrado(null);
    setBorrandoDb(true);
    try {
      const res = await fetch("/api/admin/clear-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ confirmar: "BORRAR TODO" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Error al vaciar la base de datos");
      }
      setConfirmarBorrado("");
      alert("Base de datos vaciada correctamente. Recarga la página para ver los cambios.");
      window.location.reload();
    } catch (err: any) {
      setErrorBorrado(err.message || "Error al vaciar la base de datos");
    } finally {
      setBorrandoDb(false);
    }
  };

  const sections = [
    { id: "tienda", label: "Información de la Tienda", icon: FaStore, color: "blue" },
    { id: "cuenta", label: "Cuenta y Seguridad", icon: FaUser, color: "purple" },
    { id: "inventario", label: "Inventario y Moneda", icon: FaBox, color: "green" },
    { id: "peligro", label: "Zona peligrosa", icon: FaTrash, color: "red" },
  ];

  if (guardLoading) return null;
  if (!authorized) return <AccesoDenegado requiredRoles={["jefe"]} />;

  return (
    <>
      <Head>
        <title>Configuración - VEROKAI POS</title>
      </Head>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Configuración
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Personaliza el sistema según tus necesidades
            </p>
          </div>
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <FaArrowLeft />
              Volver al Dashboard
            </button>
          </Link>
        </div>

        {/* Notificación de guardado */}
        {saved && (
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-500 dark:text-green-400 text-xl flex-shrink-0" />
              <p className="font-medium text-green-800 dark:text-green-300">
                ✅ Configuración guardada correctamente
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de navegación */}
          <div className="lg:col-span-1">
            <nav className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-slate-700 to-slate-800 dark:from-gray-900 dark:to-gray-800">
                <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">
                  Secciones
                </p>
              </div>
              <div className="p-2">
                {sections.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 mb-1 ${
                        isActive
                          ? `bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-700 dark:text-${s.color}-400 font-semibold border border-${s.color}-200 dark:border-${s.color}-800`
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className={`text-sm flex-shrink-0 ${isActive ? `text-${s.color}-600 dark:text-${s.color}-400` : "text-gray-400"}`} />
                      <span className="text-sm">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Info del sistema */}
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Versión</span>
                <span className="font-mono font-medium text-gray-700 dark:text-gray-300">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Rol</span>
                <span className="font-medium capitalize text-gray-700 dark:text-gray-300">{role ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Usuario</span>
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate ml-2">{config.username}</span>
              </div>
            </div>
          </div>

          {/* Panel principal */}
          <div className="lg:col-span-3 space-y-4">

            {/* ─── SECCIÓN: TIENDA ─── */}
            {activeSection === "tienda" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                      <FaStore className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Información de la Tienda
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Datos que aparecerán en los tickets de venta
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <FaStore className="text-blue-500" />
                        Nombre de la Tienda
                      </div>
                    </label>
                    <input
                      type="text"
                      value={nombreTienda}
                      onChange={(e) => setNombreTienda(e.target.value)}
                      placeholder="Ej: VEROKAI POS"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Se mostrará en el encabezado de los tickets de venta
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-blue-500" />
                        Dirección
                        <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej: Av. Principal 123, Ciudad"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-blue-500" />
                        Teléfono
                        <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej: +54 11 1234-5678"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <FaPrint className="text-blue-500" />
                        Mensaje de Pie de Ticket
                      </div>
                    </label>
                    <input
                      type="text"
                      value={footerTicket}
                      onChange={(e) => setFooterTicket(e.target.value)}
                      placeholder="Ej: ¡Gracias por su compra!"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Mensaje que aparece al final de cada ticket impreso
                    </p>
                  </div>

                  {/* Vista previa del ticket */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-3 uppercase tracking-wider">
                      Vista previa del encabezado del ticket
                    </p>
                    <div className="font-mono text-xs text-gray-700 dark:text-gray-300 text-center space-y-0.5">
                      <p className="text-base font-bold">{nombreTienda || "VEROKAI POS"}</p>
                      {direccion && <p className="text-gray-500">{direccion}</p>}
                      {telefono && <p className="text-gray-500">Tel: {telefono}</p>}
                      <p className="text-gray-400 mt-1">- - - - - - - - - - - - - -</p>
                      <p className="text-gray-500 mt-1 italic">{footerTicket || "¡Gracias por su compra!"}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveTienda}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    <FaSave />
                    Guardar Información de Tienda
                  </button>
                </div>
              </div>
            )}

            {/* ─── SECCIÓN: CUENTA ─── */}
            {activeSection === "cuenta" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                      <FaShieldAlt className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Cuenta y Seguridad
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nombre de usuario y PIN de acceso
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-purple-500" />
                        Nombre de usuario / Display
                      </div>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ej: Administrador"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Nombre que aparece en el panel lateral
                    </p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <FaLock className="text-purple-500" />
                      PIN / Código de Autorización
                    </h3>
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                      <p className="text-xs text-purple-700 dark:text-purple-400 flex items-start gap-2">
                        <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                        Este PIN se usa también como <strong>código de autorización</strong> para registrar compras de mercadería. Más adelante se integrará con Google Auth.
                      </p>
                    </div>

                    {config.pin && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          PIN Actual
                        </label>
                        <div className="relative">
                          <input
                            type={showPin ? "text" : "password"}
                            value={pinActual}
                            onChange={(e) => setPinActual(e.target.value)}
                            placeholder="Ingresa tu PIN actual"
                            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            {showPin ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                    )}

                    {!config.pin && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                          <FaInfoCircle />
                          No tienes PIN configurado. Crea uno para mayor seguridad.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {config.pin ? "PIN Nuevo" : "Crear PIN"}
                        </label>
                        <div className="relative">
                          <input
                            type={showPin ? "text" : "password"}
                            value={pinNuevo}
                            onChange={(e) => setPinNuevo(e.target.value)}
                            placeholder="Mínimo 4 caracteres"
                            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            {showPin ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirmar PIN
                        </label>
                        <input
                          type={showPin ? "text" : "password"}
                          value={pinConfirm}
                          onChange={(e) => setPinConfirm(e.target.value)}
                          placeholder="Repite el PIN"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                            pinConfirm && pinNuevo !== pinConfirm
                              ? "border-red-400 dark:border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        />
                      </div>
                    </div>

                    {pinError && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                          <FaExclamationTriangle />
                          {pinError}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Deja los campos de PIN vacíos si no quieres cambiar el PIN actual
                    </p>
                  </div>

                  <button
                    onClick={handleSaveCuenta}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    <FaSave />
                    Guardar Cuenta y Seguridad
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                      onClick={handleClearSession}
                      className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 py-3 px-4 rounded-xl font-medium transition-all duration-200"
                    >
                      <FaSignOutAlt />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── SECCIÓN: INVENTARIO ─── */}
            {activeSection === "inventario" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                      <FaBox className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Inventario y Moneda
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Umbrales de stock y formato de moneda
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <FaDollarSign className="text-green-500" />
                        Símbolo de Moneda
                      </div>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={simboloMoneda}
                        onChange={(e) => setSimboloMoneda(e.target.value.slice(0, 3))}
                        maxLength={3}
                        placeholder="$"
                        className="w-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white text-center text-lg font-bold transition-all duration-200"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {["$", "CLP", "USD", "€", "£", "COP", "ARS", "MXN"].map((s) => (
                          <button
                            key={s}
                            onClick={() => setSimboloMoneda(s)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              simboloMoneda === s
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Ejemplo de precio: {simboloMoneda || "$"}1.234,56
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <FaExclamationTriangle className="text-yellow-500" />
                        Umbral de Stock Bajo
                      </div>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={umbralStockBajo}
                        onChange={(e) => setUmbralStockBajo(parseInt(e.target.value) || 5)}
                        className="w-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white text-center text-lg font-bold transition-all duration-200"
                      />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">unidades</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Se mostrarán alertas cuando el stock sea ≤ {umbralStockBajo} unidades
                    </p>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {[3, 5, 10, 15, 20].map((v) => (
                        <button
                          key={v}
                          onClick={() => setUmbralStockBajo(v)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            umbralStockBajo === v
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-semibold mb-1">Formato de precios</p>
                        <p>Los precios se muestran con separador de miles (.) y decimal (,)</p>
                        <p className="mt-1 font-mono text-base">{simboloMoneda || "$"}1.234.567,89</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveInventario}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    <FaSave />
                    Guardar Inventario y Moneda
                  </button>
                </div>
              </div>
            )}

            {/* ─── SECCIÓN: ZONA PELIGROSA ─── */}
            {activeSection === "peligro" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-red-200 dark:border-red-900 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-b border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-600 rounded-xl shadow-lg">
                      <FaTrash className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-red-800 dark:text-red-200">
                        Zona peligrosa
                      </h2>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Acciones irreversibles. Usar con precaución.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2 flex items-center gap-2">
                      <FaExclamationTriangle />
                      Borrar toda la base de datos
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      Se eliminarán todos los productos, ventas, compras e historial de precios. Esta acción no se puede deshacer.
                    </p>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Escribe <span className="font-mono font-bold text-red-600 dark:text-red-400">BORRAR TODO</span> para confirmar:
                      </label>
                      <input
                        type="text"
                        value={confirmarBorrado}
                        onChange={(e) => {
                          setConfirmarBorrado(e.target.value);
                          setErrorBorrado(null);
                        }}
                        placeholder="BORRAR TODO"
                        className="w-full px-4 py-3 border border-red-300 dark:border-red-700 rounded-xl focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white font-mono placeholder-gray-400"
                      />
                      {errorBorrado && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                          <FaExclamationTriangle /> {errorBorrado}
                        </p>
                      )}
                      <button
                        onClick={handleBorrarBaseDatos}
                        disabled={borrandoDb || confirmarBorrado !== "BORRAR TODO"}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-semibold shadow-md transition-all duration-200"
                      >
                        {borrandoDb ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Vaciando base de datos...
                          </>
                        ) : (
                          <>
                            <FaTrash />
                            Borrar toda la base de datos
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </>
  );
}
