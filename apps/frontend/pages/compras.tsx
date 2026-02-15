// apps/frontend/pages/compras.tsx
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { exportToExcel } from "../utils/exportExcel";
import { 
  FaArrowLeft, 
  FaPlus, 
  FaFileExcel, 
  FaFilter,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaTimesCircle
} from "react-icons/fa";

interface Compra {
  producto: string;
  cantidad: number;
  costo_unitario: number;
  fecha: string;
  estado: "aprobada" | "pendiente" | "rechazada";
}

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [costo, setCosto] = useState(0);
  const [codigo, setCodigo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  const handleRegistrarCompra = (e: React.FormEvent) => {
    e.preventDefault();

    // Código de autorización estático
    if (codigo !== "1234") {
      alert("❌ Código de autorización inválido");
      return;
    }

    const nuevaCompra: Compra = {
      producto,
      cantidad,
      costo_unitario: costo,
      fecha: new Date().toISOString().split("T")[0],
      estado: "aprobada",
    };

    setCompras([...compras, nuevaCompra]);

    // Resetear formulario
    setProducto("");
    setCantidad(0);
    setCosto(0);
    setCodigo("");

    // Mostrar mensaje de éxito
    alert("✅ Compra registrada exitosamente");
  };

  // Filtrar compras
  const comprasFiltradas = compras.filter((compra) => {
    const matchesSearch = compra.producto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === "todos" || compra.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  // Calcular totales
  const totalCompras = compras.reduce((acc, c) => acc + (c.cantidad * c.costo_unitario), 0);
  const comprasAprobadas = compras.filter(c => c.estado === "aprobada").length;

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "aprobada":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
            <FaCheckCircle />
            Aprobada
          </span>
        );
      case "pendiente":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
            <FaClock />
            Pendiente
          </span>
        );
      case "rechazada":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
            <FaTimesCircle />
            Rechazada
          </span>
        );
    }
  };

  return (
    <>
      <Head>
        <title>Compras - VEROKAI POS</title>
      </Head>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Registro de Compras
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gestiona la entrada de mercadería y reposición de stock
            </p>
          </div>
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <FaArrowLeft />
              Volver al Dashboard
            </button>
          </Link>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">Total Compras</h3>
            <p className="text-3xl font-bold mt-2">{compras.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">Aprobadas</h3>
            <p className="text-3xl font-bold mt-2">{comprasAprobadas}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">Monto Total</h3>
            <p className="text-3xl font-bold mt-2">${totalCompras.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario para registrar compra */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleRegistrarCompra}
              className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 sticky top-24"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FaPlus className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Nueva Compra
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Producto
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del producto"
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={cantidad || ""}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Costo Unitario
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={costo || ""}
                      onChange={(e) => setCosto(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código de Autorización
                  </label>
                  <input
                    type="password"
                    placeholder="****"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Código por defecto: 1234
                  </p>
                </div>

                {cantidad > 0 && costo > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total estimado:</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${(cantidad * costo).toFixed(2)}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white py-3 px-4 rounded-lg font-medium shadow-md hover:shadow-xl transition-all duration-200"
                >
                  <FaPlus />
                  Registrar Compra
                </button>
              </div>
            </form>
          </div>

          {/* Listado de compras */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header de la tabla con filtros */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Historial de Compras
                  </h2>
                  {compras.length > 0 && (
                    <button
                      onClick={() => exportToExcel(compras, "compras_backup")}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
                    >
                      <FaFileExcel />
                      Exportar a Excel
                    </button>
                  )}
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                    <select
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value)}
                      className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="aprobada">Aprobadas</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="rechazada">Rechazadas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                {comprasFiltradas.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                      <FaPlus className="text-4xl text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {compras.length === 0 
                        ? "No hay compras registradas"
                        : "No se encontraron compras con los filtros aplicados"}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      {compras.length === 0 && "Comienza registrando tu primera compra"}
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Costo Unit.
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {comprasFiltradas.map((c, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {c.producto}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                            {c.cantidad}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                            ${c.costo_unitario.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ${(c.cantidad * c.costo_unitario).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                            {c.fecha}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getEstadoBadge(c.estado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer con totales */}
              {comprasFiltradas.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Mostrando {comprasFiltradas.length} de {compras.length} compras
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Total mostrado: ${comprasFiltradas.reduce((acc, c) => acc + (c.cantidad * c.costo_unitario), 0).toLocaleString()}
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
