// apps/frontend/pages/productos.tsx
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { exportToExcel } from "../utils/exportExcel"; // integración

interface Producto {
  id: number;
  codigo_barras: string;
  nombre: string;
  precio: number;
  stock: number;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    codigo_barras: "",
    nombre: "",
    precio: 0,
    stock: 0,
  });

  const handleAddProducto = (e: React.FormEvent) => {
    e.preventDefault();
    const producto: Producto = {
      id: productos.length + 1,
      ...nuevoProducto,
    };
    setProductos([...productos, producto]);
    setNuevoProducto({ codigo_barras: "", nombre: "", precio: 0, stock: 0 });
  };

  return (
    <>
      <Head>
        <title>Productos - VEROKAI POS</title>
      </Head>
      <main className="flex flex-col items-center min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Gestión de Productos</h1>

        {/* Botón para volver al dashboard */}
        <Link href="/dashboard">
          <button className="mb-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            ← Volver al Dashboard
          </button>
        </Link>

        {/* Formulario para agregar producto */}
        <form
          onSubmit={handleAddProducto}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8 w-full max-w-md"
        >
          <h2 className="text-xl font-bold mb-4">Agregar nuevo producto</h2>
          <input
            type="text"
            placeholder="Código de barras"
            value={nuevoProducto.codigo_barras}
            onChange={(e) =>
              setNuevoProducto({ ...nuevoProducto, codigo_barras: e.target.value })
            }
            className="border rounded w-full py-2 px-3 mb-4"
            required
          />
          <input
            type="text"
            placeholder="Nombre"
            value={nuevoProducto.nombre}
            onChange={(e) =>
              setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })
            }
            className="border rounded w-full py-2 px-3 mb-4"
            required
          />
          <input
            type="number"
            placeholder="Precio"
            value={nuevoProducto.precio}
            onChange={(e) =>
              setNuevoProducto({ ...nuevoProducto, precio: parseFloat(e.target.value) })
            }
            className="border rounded w-full py-2 px-3 mb-4"
            required
          />
          <input
            type="number"
            placeholder="Stock inicial"
            value={nuevoProducto.stock}
            onChange={(e) =>
              setNuevoProducto({ ...nuevoProducto, stock: parseInt(e.target.value) })
            }
            className="border rounded w-full py-2 px-3 mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Guardar producto
          </button>
        </form>

        {/* Listado de productos */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Listado de productos</h2>
          {productos.length === 0 ? (
            <p className="text-gray-600">No hay productos registrados.</p>
          ) : (
            <>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-4 py-2">Código</th>
                    <th className="border px-4 py-2">Nombre</th>
                    <th className="border px-4 py-2">Precio</th>
                    <th className="border px-4 py-2">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.id}>
                      <td className="border px-4 py-2">{p.codigo_barras}</td>
                      <td className="border px-4 py-2">{p.nombre}</td>
                      <td className="border px-4 py-2">${p.precio}</td>
                      <td className="border px-4 py-2">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Botón para exportar productos */}
              <button
                onClick={() => exportToExcel(productos, "productos_backup")}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Exportar a Excel
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
