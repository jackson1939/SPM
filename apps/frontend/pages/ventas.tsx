// apps/frontend/pages/ventas.tsx
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { exportToExcel } from "../utils/exportExcel";
import {
  FaArrowLeft,
  FaShoppingCart,
  FaFileExcel,
  FaBarcode,
  FaTrash,
  FaDollarSign,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPlus,
  FaMinus,
  FaReceipt
} from "react-icons/fa";

interface Producto {
  codigo_barras: string;
  nombre: string;
  precio: number;
  stock: number;
}

interface ItemCarrito extends Producto {
  cantidad: number;
}

export default function VentasPage() {
  const [productos, setProductos] = useState<Producto[]>([
    { codigo_barras: "111", nombre: "Coca Cola", precio: 10, stock: 5 },
    { codigo_barras: "222", nombre: "Pan", precio: 5, stock: 10 },
    { codigo_barras: "333", nombre: "Leche", precio: 8, stock: 3 },
  ]);

  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [codigo, setCodigo] = useState("");
  const [pago, setPago] = useState(0);
  const [ventaCompletada, setVentaCompletada] = useState(false);

  const handleAgregarProducto = () => {
    const productoIndex = productos.findIndex((p) => p.codigo_barras === codigo);
    
    if (productoIndex !== -1) {
      const producto = productos[productoIndex];

      if (producto.stock > 0) {
        // Verificar si el producto ya está en el carrito
        const itemEnCarrito = carrito.find(
          (item) => item.codigo_barras === producto.codigo_barras
        );

        if (itemEnCarrito) {
          // Incrementar cantidad
          setCarrito(
            carrito.map((item) =>
              item.codigo_barras === producto.codigo_barras
                ? { ...item, cantidad: item.cantidad + 1 }
                : item
            )
          );
        } else {
          // Agregar nuevo producto
          setCarrito([...carrito, { ...producto, cantidad: 1 }]);
        }

        // Descontar stock
        const nuevosProductos = [...productos];
        nuevosProductos[productoIndex].stock -= 1;
        setProductos(nuevosProductos);

        // Reset input
        setCodigo("");
      } else {
        alert(`⚠️ El producto ${producto.nombre} está agotado`);
      }
    } else {
      alert("❌ Producto no encontrado");
    }
  };

  const handleEliminarItem = (codigo_barras: string) => {
    const item = carrito.find((i) => i.codigo_barras === codigo_barras);
    if (item) {
      // Devolver stock
      const productoIndex = productos.findIndex((p) => p.codigo_barras === codigo_barras);
      if (productoIndex !== -1) {
        const nuevosProductos = [...productos];
        nuevosProductos[productoIndex].stock += item.cantidad;
        setProductos(nuevosProductos);
      }
    }
    setCarrito(carrito.filter((i) => i.codigo_barras !== codigo_barras));
  };

  const handleCambiarCantidad = (codigo_barras: string, delta: number) => {
    const item = carrito.find((i) => i.codigo_barras === codigo_barras);
    const producto = productos.find((p) => p.codigo_barras === codigo_barras);

    if (!item || !producto) return;

    const nuevaCantidad = item.cantidad + delta;

    if (delta > 0 && producto.stock <= 0) {
      alert("⚠️ No hay más stock disponible");
      return;
    }

    if (nuevaCantidad <= 0) {
      handleEliminarItem(codigo_barras);
      return;
    }

    setCarrito(
      carrito.map((i) =>
        i.codigo_barras === codigo_barras ? { ...i, cantidad: nuevaCantidad } : i
      )
    );

    const productoIndex = productos.findIndex((p) => p.codigo_barras === codigo_barras);
    const nuevosProductos = [...productos];
    nuevosProductos[productoIndex].stock -= delta;
    setProductos(nuevosProductos);
  };

  const handleCompletarVenta = () => {
    if (carrito.length === 0) {
      alert("⚠️ El carrito está vacío");
      return;
    }

    if (pago < total) {
      alert("⚠️ El monto pagado es insuficiente");
      return;
    }

    setVentaCompletada(true);
    setTimeout(() => {
      setCarrito([]);
      setPago(0);
      setVentaCompletada(false);
    }, 3000);
  };

  const handleLimpiarCarrito = () => {
    // Devolver todo el stock
    carrito.forEach((item) => {
      const productoIndex = productos.findIndex(
        (p) => p.codigo_barras === item.codigo_barras
      );
      if (productoIndex !== -1) {
        const nuevosProductos = [...productos];
        nuevosProductos[productoIndex].stock += item.cantidad;
        setProductos(nuevosProductos);
      }
    });
    setCarrito([]);
    setPago(0);
  };

  const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const total = subtotal;
  const vuelto = pago > 0 ? Math.max(0, pago - total) : 0;
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  // Detectar productos con stock bajo
  const productosBajos = productos.filter((p) => p.stock <= 2 && p.stock > 0);
  const productosAgotados = productos.filter((p) => p.stock === 0);

  return (
    <>
      <Head>
        <title>Ventas - VEROKAI POS</title>
      </Head>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Punto de Venta
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Sistema POS para registro de ventas
            </p>
          </div>
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <FaArrowLeft />
              Volver al Dashboard
            </button>
          </Link>
        </div>

        {/* Mensaje de venta completada */}
        {ventaCompletada && (
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-lg animate-fadeIn">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="text-green-500 dark:text-green-400 text-2xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-800 dark:text-green-300 text-lg">
                  ¡Venta Completada!
                </p>
                <p className="text-green-700 dark:text-green-400">
                  La transacción se ha registrado exitosamente
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de ingreso */}
          <div className="lg:col-span-1 space-y-6">
            {/* Escáner */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FaBarcode className="text-blue-600 dark:text-blue-400 text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Escanear Producto
                </h2>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Código de barras o buscar..."
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAgregarProducto()}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 font-mono"
                  autoFocus
                />
                <button
                  onClick={handleAgregarProducto}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white py-3 px-4 rounded-lg font-medium shadow-md hover:shadow-xl transition-all duration-200"
                >
                  <FaPlus />
                  Agregar al Carrito
                </button>
              </div>
            </div>

            {/* Totales y pago */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Resumen de Pago
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-bold">Total:</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto Pagado
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 dark:text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={pago || ""}
                      onChange={(e) => setPago(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 text-lg font-semibold"
                    />
                  </div>
                </div>

                {pago > 0 && (
                  <div
                    className={`p-4 rounded-lg ${
                      vuelto >= 0
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-medium ${
                          vuelto >= 0
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                        }`}
                      >
                        {vuelto >= 0 ? "Vuelto:" : "Falta:"}
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          vuelto >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        ${Math.abs(vuelto).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCompletarVenta}
                  disabled={carrito.length === 0 || pago < total}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white py-4 px-4 rounded-lg font-bold text-lg shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaReceipt />
                  Completar Venta
                </button>
              </div>
            </div>
          </div>

          {/* Carrito */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-lg">
                      <FaShoppingCart className="text-white text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Carrito de Compras
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {totalItems} {totalItems === 1 ? "producto" : "productos"}
                      </p>
                    </div>
                  </div>
                  {carrito.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportToExcel(carrito, "ventas_backup")}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
                      >
                        <FaFileExcel />
                        Exportar
                      </button>
                      <button
                        onClick={handleLimpiarCarrito}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
                      >
                        <FaTrash />
                        Limpiar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {carrito.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-block p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                      <FaShoppingCart className="text-6xl text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">
                      El carrito está vacío
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">
                      Escanea productos para comenzar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {carrito.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {item.nombre}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm font-mono">
                            {item.codigo_barras}
                          </p>
                          <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">
                            ${item.precio.toFixed(2)} c/u
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-300 dark:border-gray-600">
                            <button
                              onClick={() => handleCambiarCantidad(item.codigo_barras, -1)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              <FaMinus className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <span className="px-4 font-bold text-lg text-gray-900 dark:text-white min-w-[3rem] text-center">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => handleCambiarCantidad(item.codigo_barras, 1)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              disabled={
                                productos.find((p) => p.codigo_barras === item.codigo_barras)
                                  ?.stock === 0
                              }
                            >
                              <FaPlus className="text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="text-right min-w-[6rem]">
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              Subtotal
                            </p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              ${(item.precio * item.cantidad).toFixed(2)}
                            </p>
                          </div>

                          {/* Botón eliminar */}
                          <button
                            onClick={() => handleEliminarItem(item.codigo_barras)}
                            className="p-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-all duration-200"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Alertas de stock */}
            {(productosBajos.length > 0 || productosAgotados.length > 0) && (
              <div className="mt-6 space-y-3">
                {productosBajos.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 text-xl flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                          ⚠️ Productos con stock bajo:
                        </p>
                        <ul className="space-y-1">
                          {productosBajos.map((p) => (
                            <li
                              key={p.codigo_barras}
                              className="text-yellow-700 dark:text-yellow-400"
                            >
                              • {p.nombre} (Stock: {p.stock})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {productosAgotados.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-red-800 dark:text-red-300 mb-2">
                          ❌ Productos agotados:
                        </p>
                        <ul className="space-y-1">
                          {productosAgotados.map((p) => (
                            <li
                              key={p.codigo_barras}
                              className="text-red-700 dark:text-red-400"
                            >
                              • {p.nombre}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
