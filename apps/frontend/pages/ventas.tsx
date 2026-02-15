// apps/frontend/pages/ventas.tsx
import React, { useState, useEffect } from "react";
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
  FaReceipt,
  FaEdit,
  FaSearch
} from "react-icons/fa";

interface Producto {
  id: number;
  codigo_barras: string;
  nombre: string;
  precio: number;
  stock: number;
}

interface ItemCarrito extends Producto {
  cantidad: number;
}

export default function VentasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [codigo, setCodigo] = useState("");
  const [pago, setPago] = useState(0);
  const [ventaCompletada, setVentaCompletada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para entrada manual
  const [mostrarManual, setMostrarManual] = useState(false);
  const [productoManual, setProductoManual] = useState({ nombre: "", precio: 0 });
  
  // Estado para sugerencias de búsqueda
  const [sugerencias, setSugerencias] = useState<Producto[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Cargar productos desde la API
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/productos");
      if (res.ok) {
        const data = await res.json();
        const productosFormateados = data.map((p: any) => ({
          id: p.id,
          codigo_barras: p.codigo_barras || `AUTO-${p.id}`,
          nombre: p.nombre,
          precio: parseFloat(p.precio) || 0,
          stock: parseInt(p.stock) || 0,
        }));
        setProductos(productosFormateados);
      } else {
        throw new Error("Error al cargar productos");
      }
    } catch (err: any) {
      console.error("Error al cargar productos:", err);
      setError("Error al cargar productos. Por favor, recarga la página.");
    } finally {
      setLoading(false);
    }
  };

  // Buscar sugerencias mientras escribe
  const handleBuscarProducto = (valor: string) => {
    setCodigo(valor);
    
    if (valor.length >= 1) {
      const coincidencias = productos.filter((p) => 
        p.codigo_barras?.toLowerCase().includes(valor.toLowerCase()) ||
        p.nombre.toLowerCase().includes(valor.toLowerCase())
      ).slice(0, 5); // Limitar a 5 sugerencias
      
      setSugerencias(coincidencias);
      setMostrarSugerencias(coincidencias.length > 0);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  };

  // Seleccionar producto de las sugerencias
  const handleSeleccionarSugerencia = (producto: Producto) => {
    agregarProductoAlCarrito(producto);
    setCodigo("");
    setSugerencias([]);
    setMostrarSugerencias(false);
  };

  // Agregar producto al carrito
  const agregarProductoAlCarrito = (producto: Producto) => {
    if (producto.stock <= 0) {
      alert(`⚠️ El producto ${producto.nombre} está agotado`);
      return;
    }

    // Verificar si el producto ya está en el carrito
    const itemEnCarrito = carrito.find(
      (item) => item.id === producto.id
    );

    if (itemEnCarrito) {
      // Incrementar cantidad
      setCarrito(
        carrito.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      // Agregar nuevo producto
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }

    // Descontar stock localmente
    setProductos(
      productos.map((p) =>
        p.id === producto.id ? { ...p, stock: p.stock - 1 } : p
      )
    );
  };

  const handleAgregarProducto = () => {
    // Buscar por código de barras exacto primero
    let producto = productos.find((p) => p.codigo_barras === codigo);
    
    // Si no encuentra, buscar por nombre exacto
    if (!producto) {
      producto = productos.find((p) => 
        p.nombre.toLowerCase() === codigo.toLowerCase()
      );
    }
    
    // Si aún no encuentra, buscar parcialmente por código o nombre
    if (!producto) {
      producto = productos.find((p) => 
        p.codigo_barras?.toLowerCase().includes(codigo.toLowerCase()) ||
        p.nombre.toLowerCase().includes(codigo.toLowerCase())
      );
    }
    
    if (producto) {
      agregarProductoAlCarrito(producto);
      setCodigo("");
      setSugerencias([]);
      setMostrarSugerencias(false);
    } else {
      alert("❌ Producto no encontrado. Puedes agregarlo manualmente.");
    }
  };

  // Agregar producto manualmente
  const handleAgregarManual = () => {
    if (!productoManual.nombre.trim()) {
      alert("❌ Ingresa el nombre del producto");
      return;
    }
    if (productoManual.precio <= 0) {
      alert("❌ El precio debe ser mayor a 0");
      return;
    }

    const productoTemp: ItemCarrito = {
      id: Date.now(), // ID temporal
      codigo_barras: `MANUAL-${Date.now()}`,
      nombre: productoManual.nombre,
      precio: productoManual.precio,
      stock: 999, // Sin control de stock para productos manuales
      cantidad: 1,
    };

    setCarrito([...carrito, productoTemp]);
    setProductoManual({ nombre: "", precio: 0 });
    setMostrarManual(false);
  };

  const handleEliminarItem = (id: number) => {
    const item = carrito.find((i) => i.id === id);
    if (item) {
      // Devolver stock solo si no es producto manual
      if (!item.codigo_barras.startsWith("MANUAL-")) {
        setProductos(
          productos.map((p) =>
            p.id === id ? { ...p, stock: p.stock + item.cantidad } : p
          )
        );
      }
    }
    setCarrito(carrito.filter((i) => i.id !== id));
  };

  const handleCambiarCantidad = (id: number, delta: number) => {
    const item = carrito.find((i) => i.id === id);
    if (!item) return;

    // Para productos manuales, no verificar stock
    const esManual = item.codigo_barras.startsWith("MANUAL-");
    const producto = productos.find((p) => p.id === id);

    const nuevaCantidad = item.cantidad + delta;

    if (delta > 0 && !esManual && producto && producto.stock <= 0) {
      alert("⚠️ No hay más stock disponible");
      return;
    }

    if (nuevaCantidad <= 0) {
      handleEliminarItem(id);
      return;
    }

    setCarrito(
      carrito.map((i) =>
        i.id === id ? { ...i, cantidad: nuevaCantidad } : i
      )
    );

    // Actualizar stock solo para productos no manuales
    if (!esManual && producto) {
      setProductos(
        productos.map((p) =>
          p.id === id ? { ...p, stock: p.stock - delta } : p
        )
      );
    }
  };

  const [procesandoVenta, setProcesandoVenta] = useState(false);

  const handleCompletarVenta = async () => {
    if (carrito.length === 0) {
      alert("⚠️ El carrito está vacío");
      return;
    }

    if (pago < total) {
      alert("⚠️ El monto pagado es insuficiente");
      return;
    }

    setProcesandoVenta(true);

    try {
      // Preparar items para el API
      const items = carrito.map((item) => ({
        producto_id: item.codigo_barras.startsWith("MANUAL-") ? null : item.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      }));

      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          metodo_pago: "efectivo",
          monto_pagado: pago,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Venta registrada:", data);
        setVentaCompletada(true);
        
        setTimeout(() => {
          setCarrito([]);
          setPago(0);
          setVentaCompletada(false);
          // Recargar productos para reflejar el stock actualizado
          cargarProductos();
        }, 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al registrar venta");
      }
    } catch (err: any) {
      console.error("Error al completar venta:", err);
      alert(`❌ Error al completar venta: ${err.message}`);
    } finally {
      setProcesandoVenta(false);
    }
  };

  const handleLimpiarCarrito = () => {
    // Devolver todo el stock (excepto productos manuales)
    const stockRestaurado = [...productos];
    carrito.forEach((item) => {
      if (!item.codigo_barras.startsWith("MANUAL-")) {
        const productoIndex = stockRestaurado.findIndex(
          (p) => p.id === item.id
        );
        if (productoIndex !== -1) {
          stockRestaurado[productoIndex].stock += item.cantidad;
        }
      }
    });
    setProductos(stockRestaurado);
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
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Cargando productos...</p>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-red-500 dark:text-red-400">{error}</p>
                  <button 
                    onClick={cargarProductos}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Campo de búsqueda con sugerencias */}
                  <div className="relative">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Código de barras o nombre del producto..."
                        value={codigo}
                        onChange={(e) => handleBuscarProducto(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAgregarProducto()}
                        onFocus={() => codigo.length > 0 && setMostrarSugerencias(sugerencias.length > 0)}
                        onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                        autoFocus
                      />
                    </div>
                    
                    {/* Lista de sugerencias */}
                    {mostrarSugerencias && sugerencias.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {sugerencias.map((producto) => (
                          <button
                            key={producto.id}
                            onClick={() => handleSeleccionarSugerencia(producto)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{producto.nombre}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{producto.codigo_barras}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-blue-600 dark:text-blue-400">${producto.precio.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Stock: {producto.stock}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleAgregarProducto}
                    disabled={!codigo.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white py-3 px-4 rounded-lg font-medium shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPlus />
                    Agregar al Carrito
                  </button>
                  
                  {/* Botón para agregar manualmente */}
                  <button
                    onClick={() => setMostrarManual(!mostrarManual)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:from-purple-600 dark:to-purple-700 text-white py-3 px-4 rounded-lg font-medium shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    <FaEdit />
                    {mostrarManual ? "Cerrar" : "Agregar Manualmente"}
                  </button>
                  
                  {/* Formulario de entrada manual */}
                  {mostrarManual && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg space-y-3">
                      <h3 className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                        <FaEdit /> Agregar Producto Manualmente
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nombre del Producto
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Pan dulce"
                          value={productoManual.nombre}
                          onChange={(e) => setProductoManual({ ...productoManual, nombre: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Precio de Venta
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={productoManual.precio || ""}
                            onChange={(e) => setProductoManual({ ...productoManual, precio: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleAgregarManual}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200"
                      >
                        <FaPlus />
                        Agregar al Carrito
                      </button>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        * Los productos manuales no afectan el inventario
                      </p>
                    </div>
                  )}
                </div>
              )}
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
                  disabled={carrito.length === 0 || pago < total || procesandoVenta}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white py-4 px-4 rounded-lg font-bold text-lg shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesandoVenta ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FaReceipt />
                      Completar Venta
                    </>
                  )}
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
                              onClick={() => handleCambiarCantidad(item.id, -1)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              <FaMinus className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <span className="px-4 font-bold text-lg text-gray-900 dark:text-white min-w-[3rem] text-center">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => handleCambiarCantidad(item.id, 1)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              disabled={
                                !item.codigo_barras.startsWith("MANUAL-") &&
                                productos.find((p) => p.id === item.id)?.stock === 0
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
                            onClick={() => handleEliminarItem(item.id)}
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
