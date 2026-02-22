// apps/frontend/pages/dashboard.tsx
import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import * as XLSX from "xlsx";
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
  FaSync,
} from "react-icons/fa";

interface DashboardStats {
  ventasHoy: number;
  ventasAyer: number;
  productosTotal: number;
  stockBajo: number;
  comprasMes: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    ventasHoy: 0,
    ventasAyer: 0,
    productosTotal: 0,
    stockBajo: 0,
    comprasMes: 0,
  });

  const cargarStats = useCallback(async () => {
    try {
      setRefreshing(true);

      const hoyStr = new Date().toISOString().split("T")[0];
      const ayerDate = new Date();
      ayerDate.setDate(ayerDate.getDate() - 1);
      const ayerStr = ayerDate.toISOString().split("T")[0];
      const mesActual = hoyStr.substring(0, 7); // YYYY-MM

      const [ventasRes, productosRes, comprasRes] = await Promise.allSettled([
        fetch("/api/ventas"),
        fetch("/api/productos"),
        fetch("/api/compras"),
      ]);

      // Procesar ventas
      let ventasHoy = 0;
      let ventasAyer = 0;
      if (ventasRes.status === "fulfilled" && ventasRes.value.ok) {
        const ventas: any[] = await ventasRes.value.json();
        ventas.forEach((v) => {
          const fechaVenta = (v.fecha ?? "").split("T")[0];
          const total = Number(v.total) || 0;
          if (fechaVenta === hoyStr) ventasHoy += total;
          if (fechaVenta === ayerStr) ventasAyer += total;
        });
      }

      // Procesar productos
      let productosTotal = 0;
      let stockBajo = 0;
      if (productosRes.status === "fulfilled" && productosRes.value.ok) {
        const productos: any[] = await productosRes.value.json();
        productosTotal = productos.length;
        stockBajo = productos.filter(
          (p) => (Number(p.stock) || 0) <= 5
        ).length;
      }

      // Procesar compras del mes
      let comprasMes = 0;
      if (comprasRes.status === "fulfilled" && comprasRes.value.ok) {
        const compras: any[] = await comprasRes.value.json();
        compras.forEach((c) => {
          const fechaCompra = (c.fecha ?? "").split("T")[0];
          if (fechaCompra.startsWith(mesActual)) {
            comprasMes += Number(c.total) || Number(c.costo_unitario) * Number(c.cantidad) || 0;
          }
        });
      }

      setStats({ ventasHoy, ventasAyer, productosTotal, stockBajo, comprasMes });
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    if (!userRole) {
      router.push("/login");
    } else {
      setRole(userRole);
      cargarStats();
    }
  }, [router, cargarStats]);

  const cambioVentas =
    stats.ventasAyer > 0
      ? ((stats.ventasHoy - stats.ventasAyer) / stats.ventasAyer) * 100
      : 0;

  // Exportar backup real con datos actuales
  const exportarBackup = async () => {
    try {
      const [ventasRes, productosRes, comprasRes] = await Promise.allSettled([
        fetch("/api/ventas"),
        fetch("/api/productos"),
        fetch("/api/compras"),
      ]);

      const workbook = XLSX.utils.book_new();

      if (productosRes.status === "fulfilled" && productosRes.value.ok) {
        const productos: any[] = await productosRes.value.json();
        const datosProductos = productos.map((p) => ({
          ID: p.id,
          "Código de Barras": p.codigo_barras ?? "Sin código",
          Producto: p.nombre,
          "Precio ($)": Number(p.precio).toFixed(2),
          Stock: Number(p.stock),
          Estado: Number(p.stock) === 0 ? "Agotado" : Number(p.stock) <= 5 ? "Stock Bajo" : "Normal",
        }));
        const ws = XLSX.utils.json_to_sheet(datosProductos);
        ws["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, ws, "Productos");
      }

      if (ventasRes.status === "fulfilled" && ventasRes.value.ok) {
        const ventas: any[] = await ventasRes.value.json();
        const datosVentas = ventas.map((v) => ({
          ID: v.id,
          Fecha: (v.fecha ?? "").split("T")[0],
          Producto: v.producto_nombre || `#${v.producto_id}`,
          Cantidad: Number(v.cantidad),
          "Total ($)": Number(v.total).toFixed(2),
          "Método Pago": v.metodo_pago || "efectivo",
        }));
        const ws = XLSX.utils.json_to_sheet(datosVentas);
        ws["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(workbook, ws, "Ventas");
      }

      if (comprasRes.status === "fulfilled" && comprasRes.value.ok) {
        const compras: any[] = await comprasRes.value.json();
        const datosCompras = compras.map((c) => ({
          ID: c.id,
          Fecha: (c.fecha ?? "").split("T")[0],
          Producto: c.producto || c.nombre_producto || "Sin nombre",
          Cantidad: Number(c.cantidad),
          "Costo Unit. ($)": Number(c.costo_unitario || c.costo || 0).toFixed(2),
          "Total ($)": Number(c.total).toFixed(2),
          Estado: c.estado || "aprobada",
        }));
        const ws = XLSX.utils.json_to_sheet(datosCompras);
        ws["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, ws, "Compras");
      }

      // Hoja de resumen
      const resumen = [
        { Módulo: "Ventas hoy ($)", Valor: stats.ventasHoy.toFixed(2) },
        { Módulo: "Ventas ayer ($)", Valor: stats.ventasAyer.toFixed(2) },
        { Módulo: "Total productos", Valor: stats.productosTotal },
        { Módulo: "Productos con stock bajo/agotado", Valor: stats.stockBajo },
        { Módulo: "Compras del mes ($)", Valor: stats.comprasMes.toFixed(2) },
        { Módulo: "Fecha de exportación", Valor: new Date().toLocaleString("es-ES") },
      ];
      const wsResumen = XLSX.utils.json_to_sheet(resumen);
      wsResumen["!cols"] = [{ wch: 35 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, wsResumen, "Resumen");

      XLSX.writeFile(workbook, `backup_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err) {
      console.error("Error al exportar backup:", err);
      alert("Error al generar el backup. Intenta de nuevo.");
    }
  };

  const renderContent = () => {
    switch (role) {
      case "jefe":
        return (
          <div className="space-y-6">
            {/* Header */}
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
                onClick={cargarStats}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                <FaSync className={refreshing ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Ventas hoy */}
              <div className="bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FaDollarSign className="text-2xl" />
                  </div>
                  {stats.ventasAyer > 0 && (
                    <span
                      className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                        cambioVentas >= 0 ? "bg-white/20" : "bg-red-500/30"
                      }`}
                    >
                      {cambioVentas >= 0 ? (
                        <FaArrowUp className="text-xs" />
                      ) : (
                        <FaArrowDown className="text-xs" />
                      )}
                      {Math.abs(cambioVentas).toFixed(1)}%
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium opacity-90">Ventas Hoy</h3>
                <p className="text-3xl font-bold mt-1">
                  ${stats.ventasHoy.toFixed(2)}
                </p>
                {stats.ventasAyer > 0 && (
                  <p className="text-xs opacity-70 mt-1">
                    Ayer: ${stats.ventasAyer.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Total Productos */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FaBox className="text-2xl" />
                  </div>
                </div>
                <h3 className="text-sm font-medium opacity-90">Total Productos</h3>
                <p className="text-3xl font-bold mt-1">{stats.productosTotal}</p>
                <p className="text-xs opacity-70 mt-1">en inventario</p>
              </div>

              {/* Compras del Mes */}
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FaShoppingCart className="text-2xl" />
                  </div>
                </div>
                <h3 className="text-sm font-medium opacity-90">Compras del Mes</h3>
                <p className="text-3xl font-bold mt-1">
                  ${stats.comprasMes.toFixed(2)}
                </p>
                <p className="text-xs opacity-70 mt-1">mes actual</p>
              </div>

              {/* Stock Bajo */}
              <div className="bg-gradient-to-br from-red-400 to-red-600 dark:from-red-600 dark:to-red-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FaWarehouse className="text-2xl" />
                  </div>
                  {stats.stockBajo > 0 && (
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                      Alerta
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium opacity-90">Stock Bajo / Agotado</h3>
                <p className="text-3xl font-bold mt-1">
                  {stats.stockBajo} productos
                </p>
              </div>
            </div>

            {/* Módulos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/productos">
                <div className="group bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-500 transform hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <FaBox className="text-blue-600 dark:text-blue-400 text-4xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white">Productos</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Gestión de inventario</p>
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
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white">Ventas</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Registra transacciones</p>
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
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white">Compras</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Reposición de stock</p>
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
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white">Reportes</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Análisis y estadísticas</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Genera reportes detallados y analiza el rendimiento de tu negocio.
                  </p>
                </div>
              </Link>
            </div>

            {/* Backup */}
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
                    Descarga todos los datos reales del sistema en formato Excel (Productos, Ventas, Compras).
                  </p>
                  <button
                    onClick={exportarBackup}
                    disabled={refreshing}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 font-medium disabled:opacity-50"
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
              <p className="text-gray-500 dark:text-gray-400">Gestión de entradas de stock</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FaBox className="text-xl" />
                  </div>
                  <h3 className="text-sm font-medium opacity-90">Total Productos</h3>
                </div>
                <p className="text-3xl font-bold">{stats.productosTotal}</p>
              </div>
              <div className="bg-gradient-to-br from-red-400 to-red-600 dark:from-red-600 dark:to-red-800 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FaWarehouse className="text-xl" />
                  </div>
                  <h3 className="text-sm font-medium opacity-90">Stock Bajo / Agotado</h3>
                </div>
                <p className="text-3xl font-bold">{stats.stockBajo}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <FaWarehouse className="text-blue-600 dark:text-blue-400 text-3xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Entrada de Stock</h3>
                  <p className="text-gray-500 dark:text-gray-400">Registra nuevas compras de mercadería</p>
                </div>
              </div>
              <Link href="/compras">
                <button className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 font-medium text-lg">
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
              <p className="text-gray-500 dark:text-gray-400">Punto de venta</p>
            </div>

            <div className="bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FaDollarSign className="text-xl" />
                </div>
                <h3 className="text-sm font-medium opacity-90">Ventas de Hoy</h3>
              </div>
              <p className="text-3xl font-bold">${stats.ventasHoy.toFixed(2)}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <FaShoppingCart className="text-green-600 dark:text-green-400 text-3xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Registrar Venta</h3>
                  <p className="text-gray-500 dark:text-gray-400">Procesa las ventas del día</p>
                </div>
              </div>
              <Link href="/ventas">
                <button className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 font-medium text-lg">
                  Ir a Ventas
                </button>
              </Link>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
          </div>
        );
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard - VEROKAI POS</title>
      </Head>
      <div className="max-w-7xl mx-auto">{renderContent()}</div>
    </>
  );
}
