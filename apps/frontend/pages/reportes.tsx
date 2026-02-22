// apps/frontend/pages/reportes.tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  FaArrowLeft,
  FaChartLine,
  FaChartBar,
  FaTrophy,
  FaDollarSign,
  FaCalendarDay,
  FaCalendarWeek,
  FaShoppingCart,
  FaArrowUp,
  FaArrowDown,
  FaFileExcel,
  FaSync,
} from "react-icons/fa";

interface VentaRaw {
  id: number;
  producto_id: number | null;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  metodo_pago?: string;
  fecha: string;
}

interface VentaDia {
  fecha: string;
  producto: string;
  cantidad: number;
  total: number;
  precio_unitario: number;
}

export default function ReportesPage() {
  const [ventasRaw, setVentasRaw] = useState<VentaRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<"dia" | "semana">("dia");

  const cargarVentas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ventas");
      if (!res.ok) throw new Error("Error al cargar ventas");
      const data: VentaRaw[] = await res.json();
      setVentasRaw(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  // Normalizar fecha a YYYY-MM-DD en zona local
  const getFechaLocal = (fechaStr: string): string => {
    if (!fechaStr) return "";
    // Si ya tiene formato YYYY-MM-DD sin tiempo, usar directo
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) return fechaStr;
    // Si tiene zona horaria o T, extraer parte de fecha
    return fechaStr.split("T")[0];
  };

  const hoyStr = new Date().toISOString().split("T")[0];
  const ayerDate = new Date();
  ayerDate.setDate(ayerDate.getDate() - 1);
  const ayerStr = ayerDate.toISOString().split("T")[0];

  // Mapear ventas al formato de trabajo
  const ventas: VentaDia[] = ventasRaw.map((v) => ({
    fecha: getFechaLocal(v.fecha),
    producto: v.producto_nombre || `Producto #${v.producto_id ?? "manual"}`,
    cantidad: Number(v.cantidad) || 0,
    total: Number(v.total) || 0,
    precio_unitario: Number(v.precio_unitario) || 0,
  }));

  // Filtros por período
  const ventasHoy = ventas.filter((v) => v.fecha === hoyStr);
  const ventasAyer = ventas.filter((v) => v.fecha === ayerStr);

  const ventasSemana = ventas.filter((v) => {
    const diff =
      (new Date(hoyStr).getTime() - new Date(v.fecha + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 7;
  });

  // Totales
  const totalHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);
  const totalAyer = ventasAyer.reduce((acc, v) => acc + v.total, 0);
  const totalSemana = ventasSemana.reduce((acc, v) => acc + v.total, 0);
  const totalHistorico = ventas.reduce((acc, v) => acc + v.total, 0);

  const productosVendidosHoy = ventasHoy.reduce((acc, v) => acc + v.cantidad, 0);
  const productosVendidosSemana = ventasSemana.reduce((acc, v) => acc + v.cantidad, 0);

  const cambioVentas = totalAyer > 0 ? ((totalHoy - totalAyer) / totalAyer) * 100 : 0;
  const promedioDiario = ventasSemana.length > 0 ? totalSemana / 7 : 0;

  // Ranking de productos más vendidos (de toda la historia)
  const productosVendidosMap: Record<string, { cantidad: number; total: number }> = {};
  ventas.forEach((v) => {
    if (!productosVendidosMap[v.producto]) {
      productosVendidosMap[v.producto] = { cantidad: 0, total: 0 };
    }
    productosVendidosMap[v.producto].cantidad += v.cantidad;
    productosVendidosMap[v.producto].total += v.total;
  });
  const ranking = Object.entries(productosVendidosMap)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 5);

  // Ventas por día (últimos 7 días)
  const ventasPorDia: Record<string, number> = {};
  ventasSemana.forEach((v) => {
    ventasPorDia[v.fecha] = (ventasPorDia[v.fecha] || 0) + v.total;
  });
  const diasOrdenados = Object.keys(ventasPorDia).sort().reverse();

  // Exportar reporte a Excel con datos reales
  const exportarReporte = () => {
    const ventasExport =
      periodoSeleccionado === "dia"
        ? ventasRaw.filter((v) => getFechaLocal(v.fecha) === hoyStr)
        : ventasRaw.filter((v) => {
            const diff =
              (new Date(hoyStr).getTime() -
                new Date(getFechaLocal(v.fecha) + "T00:00:00").getTime()) /
              (1000 * 60 * 60 * 24);
            return diff >= 0 && diff < 7;
          });

    // Hoja de detalle de ventas
    const datosVentas = ventasExport.map((v) => ({
      ID: v.id,
      Fecha: getFechaLocal(v.fecha),
      Producto: v.producto_nombre || `Producto #${v.producto_id ?? "manual"}`,
      Cantidad: Number(v.cantidad),
      "Precio Unit. ($)": Number(v.precio_unitario).toFixed(2),
      "Total ($)": Number(v.total).toFixed(2),
      "Método de Pago": v.metodo_pago || "efectivo",
    }));

    const wsVentas = XLSX.utils.json_to_sheet(datosVentas);
    wsVentas["!cols"] = [
      { wch: 6 }, { wch: 12 }, { wch: 30 }, { wch: 10 },
      { wch: 14 }, { wch: 12 }, { wch: 16 },
    ];

    // Hoja resumen
    const totalPeriodo = ventasExport.reduce((acc, v) => acc + Number(v.total), 0);
    const cantidadPeriodo = ventasExport.reduce((acc, v) => acc + Number(v.cantidad), 0);
    const resumen = [
      { Métrica: "Período", Valor: periodoSeleccionado === "dia" ? "Hoy" : "Últimos 7 días" },
      { Métrica: "Total Ventas ($)", Valor: totalPeriodo.toFixed(2) },
      { Métrica: "Unidades Vendidas", Valor: cantidadPeriodo },
      { Métrica: "Número de Transacciones", Valor: ventasExport.length },
      {
        Métrica: "Promedio por Transacción ($)",
        Valor: ventasExport.length > 0 ? (totalPeriodo / ventasExport.length).toFixed(2) : "0.00",
      },
      { Métrica: "Fecha de exportación", Valor: new Date().toLocaleString("es-ES") },
    ];
    const wsResumen = XLSX.utils.json_to_sheet(resumen);
    wsResumen["!cols"] = [{ wch: 30 }, { wch: 20 }];

    // Hoja top productos
    const datosRanking = ranking.map(([producto, datos], i) => ({
      Posición: i + 1,
      Producto: producto,
      "Unidades Vendidas": datos.cantidad,
      "Total en Ventas ($)": datos.total.toFixed(2),
    }));
    const wsRanking = XLSX.utils.json_to_sheet(datosRanking);
    wsRanking["!cols"] = [{ wch: 10 }, { wch: 30 }, { wch: 18 }, { wch: 20 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, wsVentas, "Ventas");
    XLSX.utils.book_append_sheet(workbook, wsResumen, "Resumen");
    XLSX.utils.book_append_sheet(workbook, wsRanking, "Top Productos");

    const label = periodoSeleccionado === "dia" ? "diario" : "semanal";
    XLSX.writeFile(workbook, `reporte_${label}_${hoyStr}.xlsx`);
  };

  return (
    <>
      <Head>
        <title>Reportes - VEROKAI POS</title>
      </Head>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Reportes y Análisis
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Estadísticas y métricas de rendimiento
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={cargarVentas}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
            <button
              onClick={exportarReporte}
              disabled={loading || ventas.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              <FaFileExcel />
              Exportar Excel
            </button>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <FaArrowLeft />
                Volver
              </button>
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Cargando */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* Selector de período */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriodoSeleccionado("dia")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    periodoSeleccionado === "dia"
                      ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <FaCalendarDay />
                  Reporte Diario
                </button>
                <button
                  onClick={() => setPeriodoSeleccionado("semana")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    periodoSeleccionado === "semana"
                      ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <FaCalendarWeek />
                  Reporte Semanal
                </button>
              </div>
            </div>

            {/* Sin datos */}
            {ventas.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 border border-gray-200 dark:border-gray-700 text-center">
                <FaChartBar className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                  No hay ventas registradas aún
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  Las ventas registradas en el módulo de Ventas aparecerán aquí
                </p>
              </div>
            )}

            {ventas.length > 0 && (
              <>
                {/* Estadísticas principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total ventas */}
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 rounded-2xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FaDollarSign className="text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90">
                          {periodoSeleccionado === "dia" ? "Ventas Hoy" : "Ventas Semana"}
                        </p>
                        <p className="text-3xl font-bold">
                          ${periodoSeleccionado === "dia"
                            ? totalHoy.toFixed(2)
                            : totalSemana.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {periodoSeleccionado === "dia" && (
                      <div className="flex items-center gap-1 text-sm">
                        {cambioVentas >= 0 ? (
                          <>
                            <FaArrowUp className="text-green-300" />
                            <span className="text-green-300">+{cambioVentas.toFixed(1)}%</span>
                          </>
                        ) : (
                          <>
                            <FaArrowDown className="text-red-300" />
                            <span className="text-red-300">{cambioVentas.toFixed(1)}%</span>
                          </>
                        )}
                        <span className="opacity-75 ml-1">vs ayer</span>
                      </div>
                    )}
                    {periodoSeleccionado === "dia" && totalAyer === 0 && (
                      <p className="text-sm opacity-60">Sin datos de ayer</p>
                    )}
                  </div>

                  {/* Productos vendidos */}
                  <div className="bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800 rounded-2xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FaShoppingCart className="text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Unidades Vendidas</p>
                        <p className="text-3xl font-bold">
                          {periodoSeleccionado === "dia"
                            ? productosVendidosHoy
                            : productosVendidosSemana}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm opacity-75">
                      {periodoSeleccionado === "dia"
                        ? `${ventasHoy.length} transacciones`
                        : `${ventasSemana.length} transacciones`}
                    </p>
                  </div>

                  {/* Promedio */}
                  <div className="bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800 rounded-2xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FaChartLine className="text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Promedio</p>
                        <p className="text-3xl font-bold">
                          ${periodoSeleccionado === "dia"
                            ? ventasHoy.length > 0
                              ? (totalHoy / ventasHoy.length).toFixed(2)
                              : "0.00"
                            : promedioDiario.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm opacity-75">
                      {periodoSeleccionado === "dia" ? "por transacción" : "por día"}
                    </p>
                  </div>

                  {/* Total histórico */}
                  <div className="bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-600 dark:to-orange-800 rounded-2xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FaChartBar className="text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Total Histórico</p>
                        <p className="text-3xl font-bold">${totalHistorico.toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="text-sm opacity-75">{ventasRaw.length} registros en total</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top 5 productos */}
                  <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-500 rounded-lg">
                          <FaTrophy className="text-white text-2xl" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                            Top 5 Productos
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Más vendidos por cantidad (histórico)
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      {ranking.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-8">
                          Sin datos de ventas
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {ranking.map(([producto, datos], index) => {
                            const maxCantidad = ranking[0][1].cantidad;
                            const porcentaje = (datos.cantidad / maxCantidad) * 100;
                            return (
                              <div key={producto} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        index === 0
                                          ? "bg-yellow-400 text-yellow-900"
                                          : index === 1
                                          ? "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                                          : index === 2
                                          ? "bg-orange-400 text-orange-900"
                                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                      }`}
                                    >
                                      {index + 1}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900 dark:text-white">
                                        {producto}
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        ${datos.total.toFixed(2)} en ventas
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                      {datos.cantidad}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">unidades</p>
                                  </div>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      index === 0
                                        ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                        : index === 1
                                        ? "bg-gradient-to-r from-gray-400 to-gray-500"
                                        : index === 2
                                        ? "bg-gradient-to-r from-orange-400 to-orange-500"
                                        : "bg-gradient-to-r from-blue-400 to-blue-500"
                                    }`}
                                    style={{ width: `${porcentaje}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ventas por día */}
                  <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500 rounded-lg">
                          <FaChartBar className="text-white text-2xl" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                            Ventas por Día
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Últimos 7 días con actividad
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      {diasOrdenados.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-8">
                          Sin ventas en los últimos 7 días
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {diasOrdenados.map((fecha) => {
                            const total = ventasPorDia[fecha];
                            const maxTotal = Math.max(...Object.values(ventasPorDia));
                            const porcentaje = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                            const ventasDia = ventas.filter((v) => v.fecha === fecha);
                            return (
                              <div key={fecha} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                      {new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "short",
                                      })}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {ventasDia.length}{" "}
                                      {ventasDia.length === 1 ? "transacción" : "transacciones"}
                                    </p>
                                  </div>
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    ${total.toFixed(2)}
                                  </p>
                                </div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                    style={{ width: `${porcentaje}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabla detallada */}
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      Historial de Ventas
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {periodoSeleccionado === "dia"
                        ? `${ventasHoy.length} registros hoy`
                        : `${ventasSemana.length} registros esta semana`}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Cant.
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Precio Unit.
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {(periodoSeleccionado === "dia" ? ventasHoy : ventasSemana)
                          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                          .map((v, i) => (
                            <tr
                              key={i}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                {new Date(v.fecha + "T00:00:00").toLocaleDateString("es-ES")}
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                {v.producto}
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                {v.cantidad}
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                ${v.precio_unitario.toFixed(2)}
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  ${v.total.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        {(periodoSeleccionado === "dia" ? ventasHoy : ventasSemana).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                              No hay ventas en este período
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
