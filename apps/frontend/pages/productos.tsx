// apps/frontend/pages/productos.tsx
import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  FaArrowLeft,
  FaPlus,
  FaFileExcel,
  FaSearch,
  FaFilter,
  FaExclamationTriangle,
  FaBarcode,
  FaBox,
  FaDollarSign,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaSave,
  FaTimes,
} from "react-icons/fa";

interface Producto {
  id: number;
  codigo_barras: string | null;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStock, setFilterStock] = useState<string>("todos");

  // Estado para confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Ref para el input de código de barras (para foco automático del escáner)
  const barcodeInputRef = useRef<HTMLInputElement>(null);

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
      const productosFormateados = data.map((p: any) => ({
        ...p,
        precio: typeof p.precio === "string" ? parseFloat(p.precio) : p.precio ?? 0,
        stock: typeof p.stock === "string" ? parseInt(p.stock) : p.stock ?? 0,
        codigo_barras: p.codigo_barras ?? null,
      }));
      setProductos(productosFormateados);
    } catch (err: any) {
      setError(err.message || "Error al cargar productos");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleAddProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
          codigo_barras: nuevoProducto.codigo_barras.trim() || undefined,
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
      setProductos((prev) => [...prev, producto]);
      setNuevoProducto({ codigo_barras: "", nombre: "", precio: 0, stock: 0 });
      setSuccess("Producto guardado correctamente");
      setTimeout(() => setSuccess(null), 3000);

      // Volver el foco al input de código de barras para el siguiente producto
      barcodeInputRef.current?.focus();
    } catch (err: any) {
      setError(err.message || "Error al guardar producto");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProducto = async (id: number) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/productos?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al eliminar producto");
      }

      setProductos((prev) => prev.filter((p) => p.id !== id));
      setSuccess("Producto eliminado correctamente");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al eliminar producto");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  // Exportar inventario con columnas correctas y legibles
  const exportarInventario = () => {
    const datos = productosFiltrados.map((p) => ({
      ID: p.id,
      "Código de Barras": p.codigo_barras ?? "Sin código",
      Producto: p.nombre,
      "Precio ($)": p.precio.toFixed(2),
      Stock: p.stock,
      Estado: p.stock === 0 ? "Agotado" : p.stock <= 5 ? "Stock Bajo" : "Normal",
      "Valor en Stock ($)": (p.precio * p.stock).toFixed(2),
    }));

    const worksheet = XLSX.utils.json_to_sheet(datos);

    // Ajustar anchos de columnas
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 12 },
      { wch: 8 },
      { wch: 12 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");

    // Hoja resumen
    const resumen = [
      { Métrica: "Total de Productos", Valor: totalProductos },
      { Métrica: "Productos con Stock Bajo", Valor: stockBajo },
      { Métrica: "Productos Agotados", Valor: agotados },
      { Métrica: "Valor Total del Inventario ($)", Valor: valorInventario.toFixed(2) },
      { Métrica: "Fecha de exportación", Valor: new Date().toLocaleString("es-ES") },
    ];
    const wsResumen = XLSX.utils.json_to_sheet(resumen);
    wsResumen["!cols"] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, wsResumen, "Resumen");

    XLSX.writeFile(workbook, `inventario_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Filtrar productos
  const productosFiltrados = productos.filter((producto) => {
    const matchesSearch =
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (producto.codigo_barras ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStock = true;
    if (filterStock === "bajo") matchesStock = producto.stock <= 5 && producto.stock > 0;
    else if (filterStock === "agotado") matchesStock = producto.stock === 0;

    return matchesSearch && matchesStock;
  });

  // Estadísticas
  const totalProductos = productos.length;
  const stockBajo = productos.filter((p) => p.stock <= 5 && p.stock > 0).length;
  const agotados = productos.filter((p) => p.stock === 0).length;
  const valorInventario = productos.reduce((acc, p) => acc + p.precio * p.stock, 0);

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
          <FaTimesCircle />
          Agotado
        </span>
      );
    } else if (stock <= 5) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
          <FaExclamationTriangle />
          Bajo
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
          <FaCheckCircle />
          Normal
        </span>
      );
    }
  };

  return (
    <>
      <Head>
        <title>Productos - VEROKAI POS</title>
      </Head>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Gestión de Productos
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Administra tu inventario y controla el stock
            </p>
          </div>
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <FaArrowLeft />
              Volver al Dashboard
            </button>
          </Link>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FaTimesCircle className="text-red-500 dark:text-red-400 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-400">Error</p>
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="text-green-500 dark:text-green-400 text-xl flex-shrink-0 mt-0.5" />
              <p className="text-green-800 dark:text-green-300 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <FaBox className="text-xl" />
              </div>
              <h3 className="text-sm font-medium opacity-90">Total Productos</h3>
            </div>
            <p className="text-3xl font-bold">{totalProductos}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-600 dark:to-yellow-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <FaExclamationTriangle className="text-xl" />
              </div>
              <h3 className="text-sm font-medium opacity-90">Stock Bajo</h3>
            </div>
            <p className="text-3xl font-bold">{stockBajo}</p>
          </div>

          <div className="bg-gradient-to-br from-red-400 to-red-600 dark:from-red-600 dark:to-red-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <FaTimesCircle className="text-xl" />
              </div>
              <h3 className="text-sm font-medium opacity-90">Agotados</h3>
            </div>
            <p className="text-3xl font-bold">{agotados}</p>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <FaDollarSign className="text-xl" />
              </div>
              <h3 className="text-sm font-medium opacity-90">Valor Inventario</h3>
            </div>
            <p className="text-3xl font-bold">${valorInventario.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Alertas de stock */}
        {(stockBajo > 0 || agotados > 0) && (
          <div className="space-y-4">
            {agotados > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaTimesCircle className="text-red-500 dark:text-red-400 text-xl flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">
                      Productos Agotados ({agotados})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {productos.filter((p) => p.stock === 0).map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{p.nombre}</p>
                            {p.codigo_barras && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{p.codigo_barras}</p>
                            )}
                          </div>
                          <span className="text-red-600 dark:text-red-400 font-bold text-sm">0</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {stockBajo > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 text-xl flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                      Stock Bajo ({stockBajo}) — Menos de 6 unidades
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {productos.filter((p) => p.stock > 0 && p.stock <= 5).map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{p.nombre}</p>
                            {p.codigo_barras && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{p.codigo_barras}</p>
                            )}
                          </div>
                          <span className="text-yellow-600 dark:text-yellow-400 font-bold text-sm">{p.stock}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleAddProducto}
              className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 sticky top-24"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FaPlus className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Nuevo Producto
                </h2>
              </div>

              <div className="space-y-4">
                {/* Código de barras — compatible con escáner físico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <FaBarcode />
                      Código de Barras
                      <span className="text-gray-400 text-xs">(opcional)</span>
                    </div>
                  </label>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Escanea o escribe el código..."
                    value={nuevoProducto.codigo_barras}
                    onChange={(e) =>
                      setNuevoProducto({ ...nuevoProducto, codigo_barras: e.target.value })
                    }
                    onKeyDown={(e) => {
                      // Los escáneres de código de barras envían Enter al terminar
                      // Mover foco al nombre automáticamente
                      if (e.key === "Enter" && nuevoProducto.codigo_barras.trim()) {
                        e.preventDefault();
                        const nombreInput = document.getElementById("producto-nombre");
                        nombreInput?.focus();
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 font-mono"
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Usa el lector de barras o escribe el código manualmente
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Producto <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="producto-nombre"
                    type="text"
                    placeholder="Ej: Coca Cola 500ml"
                    value={nuevoProducto.nombre}
                    onChange={(e) =>
                      setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <FaDollarSign />
                      Precio <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={nuevoProducto.precio || ""}
                      onChange={(e) =>
                        setNuevoProducto({
                          ...nuevoProducto,
                          precio: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <FaBox />
                      Stock Inicial
                    </div>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={nuevoProducto.stock || ""}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        stock: e.target.value === "" ? 0 : parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white py-3 px-4 rounded-lg font-medium shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Guardar Producto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Listado */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header con filtros */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Inventario
                  </h2>
                  {productos.length > 0 && (
                    <button
                      onClick={exportarInventario}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
                    >
                      <FaFileExcel />
                      Exportar a Excel
                    </button>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                    <select
                      value={filterStock}
                      onChange={(e) => setFilterStock(e.target.value)}
                      className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="todos">Todos los productos</option>
                      <option value="bajo">Stock bajo (≤5)</option>
                      <option value="agotado">Agotados</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                {loadingList ? (
                  <div className="p-12 text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando productos...</p>
                  </div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                      <FaBox className="text-4xl text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {productos.length === 0
                        ? "No hay productos registrados"
                        : "No se encontraron productos con los filtros aplicados"}
                    </p>
                    {productos.length === 0 && (
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        Comienza agregando tu primer producto
                      </p>
                    )}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {productosFiltrados.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            {p.codigo_barras ? (
                              <div className="flex items-center gap-2">
                                <FaBarcode className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                                  {p.codigo_barras}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-xs italic">
                                Sin código
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {p.nombre}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ${p.precio.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`font-bold ${
                                p.stock === 0
                                  ? "text-red-600 dark:text-red-400"
                                  : p.stock <= 5
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              {p.stock}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getStockBadge(p.stock)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            {confirmDelete === p.id ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-xs text-gray-600 dark:text-gray-400">¿Eliminar?</span>
                                <button
                                  onClick={() => handleDeleteProducto(p.id)}
                                  disabled={deletingId === p.id}
                                  className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {deletingId === p.id ? (
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <FaCheckCircle />
                                  )}
                                  Sí
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-xs font-medium transition-colors"
                                >
                                  <FaTimes />
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(p.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors mx-auto"
                              >
                                <FaTrash className="text-xs" />
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              {productosFiltrados.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Mostrando {productosFiltrados.length} de {productos.length} productos
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Valor visible: ${productosFiltrados.reduce((acc, p) => acc + p.precio * p.stock, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
