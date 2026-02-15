// apps/frontend/pages/productos.tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { exportToExcel } from "../utils/exportExcel";

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
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar productos desde la API
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoadingList(true);
        setError(null);
        const res = await fetch("/api/productos");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Error al cargar productos");
        }
        const data = await res.json();
        setProductos(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar productos");
        console.error("Error:", err);
      } finally {
        setLoadingList(false);
      }
    };

    fetchProductos();
  }, []);

  const handleAddProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validación en el frontend
    if (!nuevoProducto.codigo_barras.trim()) {
      setError("El código de barras es requerido");
      return;
    }

    if (!nuevoProducto.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }

    if (nuevoProducto.precio <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }

    if (nuevoProducto.stock < 0) {
      setError("El stock no puede ser negativo");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_barras: nuevoProducto.codigo_barras.trim(),
          nombre: nuevoProducto.nombre.trim(),
          precio: nuevoProducto.precio,
          stock: nuevoProducto.stock,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al guardar producto");
      }

      const producto = await res.json();
      setProductos([...productos, producto]);
      setNuevoProducto({ codigo_barras: "", nombre: "", precio: 0, stock: 0 });
      setSuccess("Producto guardado correctamente");
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar producto");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Productos - VEROKAI POS</title>
      </Head>
      <main className="flex flex-col items-center min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Gestión de Productos</h1>

        <Link href="/dashboard">
          <button className="mb-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            ← Volver al Dashboard
          </button>
        </Link>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded w-full max-w-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Mensaje de éxito */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded w-full max-w-md">
            {success}
          </div>
        )}

        {/* Formulario */}
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
            step="0.01"
            min="0"
            placeholder="Precio"
            value={nuevoProducto.precio || ""}
            onChange={(e) => {
              const value = e.target.value;
              setNuevoProducto({ 
                ...nuevoProducto, 
                precio: value === "" ? 0 : parseFloat(value) || 0 
              });
            }}
            className="border rounded w-full py-2 px-3 mb-4"
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Stock inicial"
            value={nuevoProducto.stock || ""}
            onChange={(e) => {
              const value = e.target.value;
              setNuevoProducto({ 
                ...nuevoProducto, 
                stock: value === "" ? 0 : parseInt(value) || 0 
              });
            }}
            className="border rounded w-full py-2 px-3 mb-4"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Guardando..." : "Guardar producto"}
          </button>
        </form>

        {/* Listado */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Listado de productos</h2>
            {productos.length > 0 && (
              <span className="text-sm text-gray-600">
                Total: {productos.length}
              </span>
            )}
          </div>
          {loadingList ? (
            <p className="text-gray-600">Cargando productos...</p>
          ) : productos.length === 0 ? (
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
                      <td className="border px-4 py-2">${p.precio.toFixed(2)}</td>
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
