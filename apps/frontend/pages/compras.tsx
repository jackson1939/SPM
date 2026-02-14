// apps/frontend/pages/compras.tsx
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { exportToExcel } from "../utils/exportExcel"; // integración

interface Compra {
  producto: string;
  cantidad: number;
  costo_unitario: number;
  fecha: string;
}

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [costo, setCosto] = useState(0);
  const [codigo, setCodigo] = useState("");

  const handleRegistrarCompra = (e: React.FormEvent) => {
    e.preventDefault();

    // Código de autorización estático
    if (codigo !== "1234") {
      alert("Código de autorización inválido");
      return;
    }

    const nuevaCompra: Compra = {
      producto,
      cantidad,
      costo_unitario: costo,
      fecha: new Date().toISOString().split("T")[0],
    };

    setCompras([...compras, nuevaCompra]);

    // Resetear formulario
    setProducto("");
    setCantidad(0);
    setCosto(0);
    setCodigo("");
  };

  return (
    <>
      <Head>
        <title>Compras - VEROKAI POS</title>
      </Head>
      <main className="flex flex-col items-center min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Registro de Compras / Reposición</h1>

        {/* Botón para volver al dashboard */}
        <Link href="/dashboard">
          <button className="mb-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            ← Volver al Dashboard
          </button>
        </Link>

        {/* Formulario para registrar compra */}
        <form
          onSubmit={handleRegistrarCompra}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8 w-full max-w-md"
        >
          <h2 className="text-xl font-bold mb-4">Agregar nueva mercadería</h2>
          <input
            type="text"
            placeholder="Producto"
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
            className="border rounded w-full py-2 px-3 mb-4"
            required
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(parseInt(e.target.value))}
            className="border rounded w-full py-2 px-3 mb-4"
            required
          />
          <input
            type="number"
            placeholder="Costo unitario"
            value={costo}
            onChange={(e) => setCosto(parseFloat(e.target.value))}
            className="border rounded w-full py-2 px-3 mb-4"
            required
          />
          <input
            type="text"
            placeholder="Código de autorización"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="border rounded w-full py-2 px-3 mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Registrar compra
          </button>
        </form>

        {/* Listado de compras */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Historial de compras</h2>
          {compras.length === 0 ? (
            <p className="text-gray-600">No hay compras registradas.</p>
          ) : (
            <>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-4 py-2">Producto</th>
                    <th className="border px-4 py-2">Cantidad</th>
                    <th className="border px-4 py-2">Costo Unitario</th>
                    <th className="border px-4 py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((c, i) => (
                    <tr key={i}>
                      <td className="border px-4 py-2">{c.producto}</td>
                      <td className="border px-4 py-2">{c.cantidad}</td>
                      <td className="border px-4 py-2">${c.costo_unitario}</td>
                      <td className="border px-4 py-2">{c.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Botón para exportar compras */}
              <button
                onClick={() => exportToExcel(compras, "compras_backup")}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Exportar compras a Excel
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}