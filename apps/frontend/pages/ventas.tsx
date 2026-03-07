// apps/frontend/pages/ventas.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { exportToExcel } from "../utils/exportExcel";
import { printTicket } from "../utils/printTicket";
import { formatPrecio } from "../utils/formatPrecio";
import { useRoleGuard } from "../hooks/useRoleGuard";
import AccesoDenegado from "../components/AccesoDenegado";
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
  FaSearch,
  FaPrint,
  FaStickyNote,
} from "react-icons/fa";

interface Producto {
  id: number;
  codigo_barras: string | null;
  nombre: string;
  precio: number;
  stock: number;
}

interface ItemCarrito extends Producto {
  cantidad: number;
}

// Beep de error via Web Audio API (sin dependencias externas)
function playErrorBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Web Audio API no disponible — ignorar
  }
}

export default function VentasPage() {
  const { authorized, loading: guardLoading } = useRoleGuard(["jefe", "cajero"]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [codigo, setCodigo] = useState("");
  const [pago, setPago] = useState(0);
  const [notas, setNotas] = useState("");
  const [ventaCompletada, setVentaCompletada] = useState(false);
  const [ultimaVenta, setUltimaVenta] = useState<{
    items: ItemCarrito[];
    total: number;
    pago: number;
    vuelto: number;
    notas: string;
    fecha: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mostrarManual, setMostrarManual] = useState(false);
  const [productoManual, setProductoManual] = useState({ nombre: "", precio: 0 });

  const [sugerencias, setSugerencias] = useState<Producto[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const codigoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    const mantenerFoco = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const esInputOtro =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.tagName === "BUTTON";
      if (!esInputOtro && codigoInputRef.current) {
        setTimeout(() => codigoInputRef.current?.focus(), 50);
      }
    };
    document.addEventListener("click", mantenerFoco);
    return () => document.removeEventListener("click", mantenerFoco);
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/productos");
      if (res.ok) {
        const data = await res.json();
        const productosFormateados = data.map((p: any) => ({
          id: p.id,
          codigo_barras: p.codigo_barras ?? null,
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

  const buscarProducto = useCallback((valor: string): Producto | undefined => {
    const v = valor.trim();
    if (!v) return undefined;
    let p = productos.find((p) => p.codigo_barras && p.codigo_barras === v);
    if (!p) p = productos.find((p) => p.nombre.toLowerCase() === v.toLowerCase());
    if (!p) p = productos.find((p) => (p.codigo_barras ?? "").toLowerCase().includes(v.toLowerCase()));
    if (!p) p = productos.find((p) => p.nombre.toLowerCase().includes(v.toLowerCase()));
    return p;
  }, [productos]);

  const handleBuscarProducto = (valor: string) => {
    setCodigo(valor);
    if (valor.length >= 1) {
      const coincidencias = productos.filter((p) =>
        (p.codigo_barras ?? "").toLowerCase().includes(valor.toLowerCase()) ||
        p.nombre.toLowerCase().includes(valor.toLowerCase())
      ).slice(0, 6);
      setSugerencias(coincidencias);
      setMostrarSugerencias(coincidencias.length > 0);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  };

  const handleSeleccionarSugerencia = (producto: Producto) => {
    agregarProductoAlCarrito(producto);
    setCodigo("");
    setSugerencias([]);
    setMostrarSugerencias(false);
    setTimeout(() => codigoInputRef.current?.focus(), 50);
  };

  const agregarProductoAlCarrito = useCallback((producto: Producto) => {
    if (producto.stock <= 0) {
      alert(`⚠️ "${producto.nombre}" está agotado`);
      return;
    }
    setCarrito((prev) => {
      const existente = prev.find((i) => i.id === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
    setProductos((prev) =>
      prev.map((p) => p.id === producto.id ? { ...p, stock: p.stock - 1 } : p)
    );
  }, []);

  const handleAgregarProducto = useCallback(() => {
    const trimmed = codigo.trim();
    if (!trimmed) return;

    const producto = buscarProducto(trimmed);
    if (producto) {
      agregarProductoAlCarrito(producto);
      setCodigo("");
      setSugerencias([]);
      setMostrarSugerencias(false);
      setTimeout(() => codigoInputRef.current?.focus(), 30);
    } else {
      // Alerta sonora cuando el código no existe
      playErrorBeep();
      setError(`Producto "${trimmed}" no encontrado`);
      setCodigo("");
      setTimeout(() => {
        setError(null);
        codigoInputRef.current?.focus();
      }, 2500);
    }
  }, [codigo, buscarProducto, agregarProductoAlCarrito]);

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
      id: Date.now(),
      codigo_barras: `MANUAL-${Date.now()}`,
      nombre: productoManual.nombre,
      precio: productoManual.precio,
      stock: 999,
      cantidad: 1,
    };

    setCarrito([...carrito, productoTemp]);
    setProductoManual({ nombre: "", precio: 0 });
    setMostrarManual(false);
  };

  const handleEliminarItem = (id: number) => {
    const item = carrito.find((i) => i.id === id);
    if (item && !(item.codigo_barras ?? "").startsWith("MANUAL-")) {
      setProductos(
        productos.map((p) =>
          p.id === id ? { ...p, stock: p.stock + item.cantidad } : p
        )
      );
    }
    setCarrito(carrito.filter((i) => i.id !== id));
  };

  const handleCambiarCantidad = (id: number, delta: number) => {
    const item = carrito.find((i) => i.id === id);
    if (!item) return;

    const esManual = (item.codigo_barras ?? "").startsWith("MANUAL-");
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

    setCarrito(carrito.map((i) => i.id === id ? { ...i, cantidad: nuevaCantidad } : i));

    if (!esManual && producto) {
      setProductos(
        productos.map((p) => p.id === id ? { ...p, stock: p.stock - delta } : p)
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
      const items = carrito.map((item) => ({
        producto_id: (item.codigo_barras ?? "").startsWith("MANUAL-") ? null : item.id,
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
          notas: notas.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Verificar si alguna venta no se guardó en la BD (fallback local)
        const hayFallbackLocal = Array.isArray(data.ventas) && data.ventas.some((v: any) => v._local);
        if (hayFallbackLocal || (data.errores && data.errores.length > 0)) {
          console.warn("⚠️ Algunas ventas no se guardaron en la BD:", data.errores);
          // Ejecutar migraciones automáticamente para reparar el schema
          fetch("/api/migrate", { method: "POST" })
            .then((r) => r.json())
            .then((migData) => console.log("Auto-reparación:", migData.results))
            .catch(() => {});
          setError(`Error al guardar en base de datos: ${data.errores?.join(", ") || "error desconocido"}. Se ejecutó reparación automática — intenta la venta nuevamente.`);
        }

        // Guardar datos del ticket antes de limpiar carrito
        setUltimaVenta({
          items: [...carrito],
          total,
          pago,
          vuelto,
          notas: notas.trim(),
          fecha: new Date(),
        });

        setVentaCompletada(true);

        setTimeout(() => {
          setCarrito([]);
          setPago(0);
          setNotas("");
          setVentaCompletada(false);
          setUltimaVenta(null);
          cargarProductos();
        }, 5000);
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
    const stockRestaurado = [...productos];
    carrito.forEach((item) => {
      if (!(item.codigo_barras ?? "").startsWith("MANUAL-")) {
        const idx = stockRestaurado.findIndex((p) => p.id === item.id);
        if (idx !== -1) {
          stockRestaurado[idx].stock += item.cantidad;
        }
      }
    });
    setProductos(stockRestaurado);
    setCarrito([]);
    setPago(0);
    setNotas("");
  };

  const handleImprimirTicket = () => {
    if (!ultimaVenta) return;
    printTicket({
      items: ultimaVenta.items.map((i) => ({
        nombre: i.nombre,
        cantidad: i.cantidad,
        precio: i.precio,
      })),
      total: ultimaVenta.total,
      pago: ultimaVenta.pago,
      vuelto: ultimaVenta.vuelto,
      notas: ultimaVenta.notas || undefined,
      fecha: ultimaVenta.fecha,
    });
  };

  const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const total = subtotal;
  const vuelto = pago > 0 ? Math.max(0, pago - total) : 0;
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const productosBajos = productos.filter((p) => p.stock <= 2 && p.stock > 0);
  const productosAgotados = productos.filter((p) => p.stock === 0);

  if (guardLoading) return null;
  if (!authorized) return <AccesoDenegado requiredRoles={["jefe", "cajero"]} />;

  return (
    <>
      <Head>
        <title>Ventas - KIOSKO ROJO</title>
      </Head>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Punto de Venta
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gestor De Almacen
            </p>
          </div>
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <FaArrowLeft />
              Volver al Dashboard
            </button>
          </Link>
        </div>

        {/* Venta completada */}
        {ventaCompletada && (
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-lg animate-fadeIn">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="text-green-500 dark:text-green-400 text-2xl flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-green-800 dark:text-green-300 text-lg">
                  ¡Venta Completada!
                </p>
                <p className="text-green-700 dark:text-green-400">
                  Total: <strong>${formatPrecio(total)}</strong> — Vuelto: <strong>${formatPrecio(vuelto)}</strong>
                </p>
                {ultimaVenta?.notas && (
                  <p className="text-green-600 dark:text-green-500 text-sm mt-1">
                    Notas: {ultimaVenta.notas}
                  </p>
                )}
              </div>
              <button
                onClick={handleImprimirTicket}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
              >
                <FaPrint />
                Imprimir Ticket
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo */}
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
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
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                    <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                      Escáner activo — apunta y escanea, o escribe el código
                    </span>
                  </div>

                  <div className="relative">
                    <div className="relative">
                      <FaBarcode className="absolute left-3 top-3.5 text-blue-500 dark:text-blue-400 text-lg" />
                      <input
                        ref={codigoInputRef}
                        type="text"
                        placeholder="Escanea o escribe código / nombre..."
                        value={codigo}
                        onChange={(e) => handleBuscarProducto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAgregarProducto();
                          }
                          if (e.key === "Escape") {
                            setCodigo("");
                            setSugerencias([]);
                            setMostrarSugerencias(false);
                          }
                        }}
                        onFocus={() => codigo.length > 0 && setMostrarSugerencias(sugerencias.length > 0)}
                        onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                        className="w-full pl-10 pr-12 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-white transition-all duration-200 text-lg font-mono tracking-wider"
                        autoFocus
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {codigo && (
                        <button
                          onClick={() => { setCodigo(""); setSugerencias([]); codigoInputRef.current?.focus(); }}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {mostrarSugerencias && sugerencias.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {sugerencias.length} resultado{sugerencias.length !== 1 ? "s" : ""} — haz clic o presiona Enter
                          </p>
                        </div>
                        {sugerencias.map((producto) => (
                          <button
                            key={producto.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSeleccionarSugerencia(producto);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                          >
                            <div className="flex justify-between items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">{producto.nombre}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                                  {producto.codigo_barras ?? "Sin código"}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-blue-600 dark:text-blue-400">${formatPrecio(producto.precio)}</p>
                                <p className={`text-xs font-medium ${producto.stock === 0 ? "text-red-500" : producto.stock <= 5 ? "text-yellow-500" : "text-green-500"}`}>
                                  Stock: {producto.stock}
                                </p>
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

                  <button
                    onClick={() => setMostrarManual(!mostrarManual)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:from-purple-600 dark:to-purple-700 text-white py-3 px-4 rounded-lg font-medium shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    <FaEdit />
                    {mostrarManual ? "Cerrar" : "Agregar Manualmente"}
                  </button>

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
                            step="1"
                            min="0"
                            placeholder="0"
                            value={productoManual.precio || ""}
                            onChange={(e) => setProductoManual({ ...productoManual, precio: Math.round(Number(e.target.value)) || 0 })}
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

            {/* Resumen de pago */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Resumen de Pago
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">
                    ${formatPrecio(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-bold">Total:</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${formatPrecio(total)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto Pagado
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={pago || ""}
                      onChange={(e) => setPago(Math.round(Number(e.target.value)) || 0)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 text-lg font-semibold"
                    />
                  </div>
                </div>

                {pago > 0 && (
                  <div className={`p-4 rounded-lg ${
                    vuelto >= 0
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${vuelto >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                        {vuelto >= 0 ? "Vuelto:" : "Falta:"}
                      </span>
                      <span className={`text-2xl font-bold ${vuelto >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        ${formatPrecio(Math.abs(vuelto))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notas de la venta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <FaStickyNote className="text-yellow-500" />
                      Notas de la venta
                      <span className="text-gray-400 text-xs">(opcional)</span>
                    </div>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Descuento aplicado, cliente frecuente, observaciones..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 text-sm resize-none"
                  />
                </div>

                <button
                  onClick={handleCompletarVenta}
                  disabled={carrito.length === 0 || pago < total || procesandoVenta}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white py-4 px-4 rounded-lg font-bold text-lg shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesandoVenta ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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
                            {item.codigo_barras ?? "Sin código"}
                          </p>
                          <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">
                            ${formatPrecio(item.precio)} c/u
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
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
                                !(item.codigo_barras ?? "").startsWith("MANUAL-") &&
                                productos.find((p) => p.id === item.id)?.stock === 0
                              }
                            >
                              <FaPlus className="text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>

                          <div className="text-right min-w-[6rem]">
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Subtotal</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              ${formatPrecio(item.precio * item.cantidad)}
                            </p>
                          </div>

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
                            <li key={p.codigo_barras} className="text-yellow-700 dark:text-yellow-400">
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
                            <li key={p.codigo_barras} className="text-red-700 dark:text-red-400">
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
