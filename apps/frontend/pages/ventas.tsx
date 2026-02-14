// apps/frontend/pages/ventas.tsx
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { exportToExcel } from "../utils/exportExcel"; // integración

interface Producto {
  codigo_barras: string;
  nombre: string;
  precio: number;
  stock: number;
}

export default function VentasPage() {
  const [productos, setProductos] = useState<Producto[]>([
    { codigo_barras: "111", nombre: "Coca Cola", precio: 10, stock: 5 },
    { codigo_barras: "222", nombre: "Pan", precio: 5, stock: 10 },
    { codigo_barras: "333", nombre: "Leche", precio: 8, stock: 3 },
  ]);

  const [carrito, setCarrito] = useState<Producto[]>([]);
  const [codigo, setCodigo] = useState("");
  const [pago, setPago] = useState(0);

  const handleAgregarProducto = () => {
    const productoIndex = productos.findIndex((p) => p.codigo_barras === codigo);
    if (productoIndex !== -1) {
      const producto = productos[productoIndex];

      if (producto.stock > 0) {
        // Agregar al carrito
        setCarrito([...carrito, producto]);

        // Descontar stock
        const nuevosProductos = [...productos];
        nuevosProductos[productoIndex].stock -= 1;
        setProductos(nuevosProductos);

        // Reset input
        setCodigo("");
      } else {
        alert(`El producto ${producto.nombre} está agotado`);
      }
    } else {
      alert("Producto no encontrado");
    }
  };

  const total = carrito.reduce((acc, p) => acc + p.precio, 0);
  const vuelto = pago > 0 ? pago - total : 0;

  // Detectar productos con stock bajo
  const productosBajos = productos.filter((p) => p.stock <= 2);

  return (
    <>
      <Head>
        <title>Ventas - VEROKAI POS</title>
      </Head>
      <main className="flex flex-col items-center min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Módulo de Ventas</h1>

        {/* Botón para volver al dashboard */}
        <Link href="/dashboard">
          <button className="mb-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            ← Volver al Dashboard
          </button>
        </Link>

        {/* Input para escanear/ingresar código */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Agregar producto</h2>
          <input
            type="text"
            placeholder="Escanee o ingrese código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="border rounded w-full py-2 px-3 mb-4"
          />
          <button
            onClick={handleAgregarProducto}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Agregar
          </button>
        </div>

        {/* Carrito */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-2xl mb-8">
          <h2 className="text-xl font-bold mb-4">Carrito</h2>
          {carrito.length === 0 ? (
            <p className="text-gray-600">No hay productos en el carrito.</p>
          ) : (
            <>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-4 py-2">Código</th>
                    <th className="border px-4 py-2">Nombre</th>
                    <th className="border px-4 py-2">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((p, i) => (
                    <tr key={i}>
                      <td className="border px-4 py-2">{p.codigo_barras}</td>
                      <td className="border px-4 py-2">{p.nombre}</td>
                      <td className="border px-4 py-2">${p.precio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Botón para exportar ventas */}
              <button
                onClick={() => exportToExcel(carrito, "ventas_backup")}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Exportar ventas a Excel
              </button>
            </>
          )}
        </div>

        {/* Totales */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md mb-8">
          <h2 className="text-xl font-bold mb-4">Totales</h2>
          <p className="mb-2">Total: ${total}</p>
          <input
            type="number"
            placeholder="Monto pagado"
            value={pago}
            onChange={(e) => setPago(parseFloat(e.target.value))}
            className="border rounded w-full py-2 px-3 mb-4"
          />
          <p className="mb-2">Vuelto: ${vuelto}</p>
        </div>

        {/* Alertas de stock bajo */}
        {productosBajos.length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-full max-w-md">
            <h2 className="font-bold mb-2">⚠️ Productos con stock bajo:</h2>
            <ul className="list-disc pl-6">
              {productosBajos.map((p) => (
                <li key={p.codigo_barras}>
                  {p.nombre} (Stock: {p.stock})
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
