// apps/frontend/pages/dashboard.tsx
import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { exportToExcel } from "../utils/exportExcel";
import { 
  FaBox, 
  FaShoppingCart, 
  FaClipboardList, 
  FaChartBar, 
  FaDownload,
  FaArrowUp,
  FaArrowDown,
  FaDollarSign,
  FaWarehouse,
  FaSync
} from "react-icons/fa";

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estadísticas de ejemplo
  const [stats, setStats] = useState({
    ventasHoy: 12450,
    productosTotal: 156,
    comprasMes: 8320,
    stockBajo: 8,
    cambioVentas: 12.5,
    cambioProductos: -3.2,
  });

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    if (!userRole) {
      router.push("/login");
    } else {
      setRole(userRole);
    }
  }, [router]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simular actualización de datos
    setTimeout(() => {
      setRefreshing(false);
      // Aquí podrías hacer fetch de datos reales
    }, 1000);
  };

  const renderContent = () => {
    switch (role) {
      case "jefe":
        return (
          <div className="space-y-6">
            {/* Header con título y botón de refresh */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Panel del Jefe
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Vista general del sistema
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                <FaSync className={refreshing ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>

            {/* Grid de estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Ventas de Hoy */}
              <div className="bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FaDollarSign className="text-2xl" />
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
                    <FaArrowUp className="text-xs" />
                    {stats.cambioVentas}%
                  </span>
                </div>
                <h3 className="text-sm font-medium opacity-90">Ventas Hoy</h3>
                <p className="text-3xl font-bold mt-1">${stats.ventasHoy.toLocaleString()}</p>
              </div>

              {/* Total Productos */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FaBox className="text-2xl" />
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
                    <FaArrowDown className="text-xs" />
                    {Math.abs(stats.cambioProductos)}%
                  </span>
                </div>
                <h3 className="text-sm font-medium opacity-90">Total Productos</h3>
                <p className="text-3xl font-bold mt-1">{stats.productosTotal}</p>
              </div>

              {/* Compras del Mes */}
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FaShoppingCart className="text-2xl" />
                  </div>
                </div>
                <h3 className="text-sm font-medium opacity-90">Compras del Mes</h3>
                <p className="text-3xl font-bold mt-1">${stats.comprasMes.toLocaleString()}</p>
              </div>

              {/* Stock Bajo */}
              <div className="bg-gradient-to-br from-red-400 to-red-600 dark:from-red-600 dark:to-red-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FaWarehouse className="text-2xl" />
                  </div>
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                    ¡Alerta!
                  </span>
                </div>
                <h3 className="text-sm font-medium opacity-90">Stock Bajo</h3>
                <p className="text-3xl font-bold mt-1">{stats.stockBajo} productos</p>
              </div>
            </div>

            {/* Grid de módulos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/productos">
                <div className="group bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-500 transform hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <FaBox className="text-blue-600 dark:text-blue-400 text-4xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                        Productos
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Gestión de inventario
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Administra tu catálogo de productos, actualiza precios y controla el stock.
                  </p>
                </div>
              </Link>

              <Link href="/ventas">
                <div className="group bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-gray-700 cursor-pointer rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-green-400 dark:border-gray-700 dark:hover:border-green-500 transform hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <FaShoppingCart className="text-green-600 dark:text-green-400 text-4xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                        Ventas
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Registra transacciones
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Procesa ventas rápidamente y lleva un registro detallado de todas las transacciones.
                  </p>
                </div>
              </Link>

              <Link href="/compras">
                <div className="group bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-gray-700 cursor-pointer rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-yellow-400 dark:border-gray-700 dark:hover:border-yellow-500 transform hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <FaClipboardList className="text-yellow-600 dark:text-yellow-400 text-4xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                        Compras
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Reposición de stock
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Registra la entrada de mercadería y gestiona las compras a proveedores.
                  </p>
                </div>
              </Link>

              <Link href="/reportes">
                <div className="group bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-purple-400 dark:border-gray-700 dark:hover:border-purple-500 transform hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <FaChartBar className="text-purple-600 dark:text-purple-400 text-4xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                        Reportes
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Análisis y estadísticas
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Genera reportes detallados y analiza el rendimiento de tu negocio.
                  </p>
                </div>
              </Link>
            </div>

            {/* Copia de seguridad */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-lg rounded-2xl p-8 border border-gray-200 dark:border-gray-600">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <FaDownload className="text-white text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      Copia de Seguridad
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Descarga todos los datos del sistema en formato Excel para mantener un respaldo seguro.
                  </p>
                  <button
                    onClick={() =>
                      exportToExcel(
                        [
                          { modulo: "Productos", fecha: new Date().toISOString() },
                          { modulo: "Ventas", fecha: new Date().toISOString() },
                          { modulo: "Compras", fecha: new Date().toISOString() },
                          { modulo: "Reportes", fecha: new Date().toISOString() },
                        ],
                        "backup_general"
                      )
                    }
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 font-medium"
                  >
                    <FaDownload />
                    Exportar todo a Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "almacen":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Panel de Almacén
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Gestión de entradas de stock
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <FaWarehouse className="text-blue-600 dark:text-blue-400 text-3xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Entrada de Stock
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Registra nuevas compras de mercadería
                  </p>
                </div>
              </div>
              
              <Link href="/compras">
                <button className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 font-medium text-lg">
                  Ir a Compras
                </button>
              </Link>
            </div>
          </div>
        );

      case "cajero":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Panel del Cajero
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Punto de venta
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <FaShoppingCart className="text-green-600 dark:text-green-400 text-3xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Registrar Venta
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Procesa las ventas del día
                  </p>
                </div>
              </div>
              
              <Link href="/ventas">
                <button className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 font-medium text-lg">
                  Ir a Ventas
                </button>
              </Link>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        );
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard - VEROKAI POS</title>
      </Head>
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
}
