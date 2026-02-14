// apps/frontend/pages/reportes.tsx
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";

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
  ]);

  // Reporte diario
  const hoy = "2026-02-14";
  const ventasHoy = ventas.filter((v) => v.fecha === hoy);
  const totalHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);

  // Reporte semanal (últimos 7 días)
  const ventasSemana = ventas.filter((v) => {
    const fechaVenta = new Date(v.fecha);
    const hoyDate = new Date(hoy);
    const diff = (hoyDate.getTime() - fechaVenta.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  const totalSemana = ventasSemana.reduce((acc, v) => acc + v.total, 0);

  // Productos más vendidos
  const productosVendidos: Record<string, number> = {};
  ventas.forEach((v) => {
    productosVendidos[v.producto] = (productosVendidos[v.producto] || 0) + v.cantidad;
  });
  const ranking = Object.entries(productosVendidos).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <Head>
        <title>Reportes - VEROKAI POS</title>
      </Head>
      <main className="flex flex-col items-center min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Reportes Básicos</h1>

        {/* Botón para volver al dashboard */}
        <Link href="/dashboard">
          <button className="mb-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            ← Volver al Dashboard
          </button>
        </Link>

        {/* Reporte diario */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Reporte Diario</h2>
          <p>Ventas de hoy ({hoy}): ${totalHoy}</p>
        </div>

        {/* Reporte semanal */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Reporte Semanal</h2>
          <p>Total de ventas últimos 7 días: ${totalSemana}</p>
        </div>

        {/* Productos más vendidos */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Productos más vendidos</h2>
          <ul className="list-disc pl-6">
            {ranking.map(([producto, cantidad]) => (
              <li key={producto}>
                {producto}: {cantidad} unidades
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
