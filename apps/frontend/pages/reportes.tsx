// apps/frontend/pages/reportes.tsx
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
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
  FaFileExcel
} from "react-icons/fa";
import { exportToExcel } from "../utils/exportExcel";

interface Venta {
  fecha: string;
  producto: string;
  cantidad: number;
  total: number;
}

export default function ReportesPage() {
  const [ventas] = useState<Venta[]>([
    { fecha: "2026-02-14", producto: "Coca Cola", cantidad: 2, total: 20 },
    { fecha: "2026-02-14", producto: "Pan", cantidad: 3, total: 15 },
    { fecha: "2026-02-13", producto: "Leche", cantidad: 1, total: 8 },
    { fecha: "2026-02-12", producto: "Coca Cola", cantidad: 1, total: 10 },
    { fecha: "2026-02-12", producto: "Pan", cantidad: 5, total: 25 },
    { fecha: "2026-02-11", producto: "Leche", cantidad: 2, total: 16 },
  ]);

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<"dia" | "semana">("dia");

  // Reporte diario
  const hoy = "2026-02-14";
  const ventasHoy = ventas.filter((v) => v.fecha === hoy);
  const totalHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);
  const productosVendidosHoy = ventasHoy.reduce((acc, v) => acc + v.cantidad, 0);

  // Reporte semanal (últimos 7 días)
  const ventasSemana = ventas.filter((v) => {
    const fechaVenta = new Date(v.fecha);
    const hoyDate = new Date(hoy);
    const diff = (hoyDate.getTime() - fechaVenta.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  const totalSemana = ventasSemana.reduce((acc, v) => acc + v.total, 0);
  const productosVendidosSemana = ventasSemana.reduce((acc, v) => acc + v.cantidad, 0);

  // Promedio diario de la semana
  const promedioDiario = totalSemana / 7;

  // Comparación con día anterior
  const ayer = "2026-02-13";
  const ventasAyer = ventas.filter((v) => v.fecha === ayer);
  const totalAyer = ventasAyer.reduce((acc, v) => acc + v.total, 0);
  const cambioVentas = totalAyer > 0 ? ((totalHoy - totalAyer) / totalAyer) * 100 : 0;

  // Productos más vendidos
  const productosVendidos: Record<string, { cantidad: number; total: number }> = {};
  ventas.forEach((v) => {
    if (!productosVendidos[v.producto]) {
      productosVendidos[v.producto] = { cantidad: 0, total: 0 };
    }
    productosVendidos[v.producto].cantidad += v.cantidad;
    productosVendidos[v.producto].total += v.total;
  });
  const ranking = Object.entries(productosVendidos)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 5);

  // Ventas por día
  const ventasPorDia: Record<string, number> = {};
  ventas.forEach((v) => {
    ventasPorDia[v.fecha] = (ventasPorDia[v.fecha] || 0) + v.total;
  });

  const diasOrdenados = Object.keys(ventasPorDia).sort();

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
              onClick={() => exportToExcel(ventas, "reporte_ventas")}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <FaFileExcel />
              Exportar Datos
            </button>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <FaArrowLeft />
                Volver
              </button>
            </Link>
          </div>
        </div>

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
                  ${periodoSeleccionado === "dia" ? totalHoy : totalSemana}
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
          </div>

          {/* Productos vendidos */}
          <div className="bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800 rounded-2xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <FaShoppingCart className="text-2xl" />
              </div>
              <div>
                <p className="text-sm opacity-90">Productos Vendidos</p>
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
                    ? (ventasHoy.length > 0 ? (totalHoy / ventasHoy.length).toFixed(2) : "0")
                    : promedioDiario.toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-sm opacity-75">
              {periodoSeleccionado === "dia" ? "por venta" : "por día"}
            </p>
          </div>

          {/* Total general */}
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-600 dark:to-orange-800 rounded-2xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <FaChartBar className="text-2xl" />
              </div>
              <div>
                <p className="text-sm opacity-90">Total Histórico</p>
                <p className="text-3xl font-bold">
                  ${ventas.reduce((acc, v) => acc + v.total, 0)}
                </p>
              </div>
            </div>
            <p className="text-sm opacity-75">{ventas.length} ventas registradas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Productos más vendidos */}
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
                    Más vendidos por cantidad
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
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
                              ${datos.total} en ventas
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
                      {/* Barra de progreso */}
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
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    Últimos días registrados
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {diasOrdenados.reverse().map((fecha) => {
                  const total = ventasPorDia[fecha];
                  const maxTotal = Math.max(...Object.values(ventasPorDia));
                  const porcentaje = (total / maxTotal) * 100;
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
                            {ventasDia.length} {ventasDia.length === 1 ? "venta" : "ventas"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            ${total}
                          </p>
                        </div>
                      </div>
                      {/* Barra de progreso */}
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla detallada */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Historial de Ventas
            </h2>
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
                    Cantidad
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {ventas
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
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${v.total}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}