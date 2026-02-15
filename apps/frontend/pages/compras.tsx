// apps/frontend/pages/compras.tsx
import React, { useState, useEffect, useMemo } from "react";
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
  FaTimesCircle,
  FaExclamationTriangle,
  FaBox,
  FaBarcode
} from "react-icons/fa";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  codigo_barras?: string;  // ✅ AGREGADO
}

interface Compra {
  id?: string;
  producto: string;
  producto_id?: string;
  cantidad: number;
  costo_unitario: number;
  fecha: string;
  estado: "aprobada" | "pendiente" | "rechazada";
}

export default function ComprasPage() {
  // Estados para compras
  const [compras, setCompras] = useState<Compra[]>([]);
  const [producto, setProducto] = useState("");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [costo, setCosto] = useState(0);
  const [codigo, setCodigo] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [precioVenta, setPrecioVenta] = useState(0);
  const [crearNuevoProducto, setCrearNuevoProducto] = useState(false);
  const [searchProducto, setSearchProducto] = useState(""); // Búsqueda para selector de productos
  const [searchHistorial, setSearchHistorial] = useState(""); // Búsqueda para historial de compras
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filtroFecha, setFiltroFecha] = useState<"todos" | "hoy" | "mes">("todos");
  
  // Estados para productos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error" | "warning", texto: string } | null>(null);

  // Cargar productos y compras desde el backend
  useEffect(() => {
    cargarProductos();
    cargarCompras();
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await fetch("/api/productos");
      if (res.ok) {
        const data = await res.json();
        // Convertir id de number a string para compatibilidad
        const productosFormateados = data.map((p: any) => ({
          ...p,
          id: String(p.id),
        }));
        setProductos(productosFormateados);
      } else {
        throw new Error("Error al cargar productos");
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      mostrarMensaje("warning", "Error al cargar productos desde el servidor");
    }
  };

  const [loadingCompras, setLoadingCompras] = useState(true);
  const [errorCompras, setErrorCompras] = useState<string | null>(null);

  const cargarCompras = async () => {
    try {
      setLoadingCompras(true);
      setErrorCompras(null);
      console.log("[ComprasPage] Cargando compras...");
      const res = await fetch("/api/compras");
      if (res.ok) {
        const data = await res.json();
        console.log("[ComprasPage] Datos recibidos de API:", data);
        
        // Manejar nueva estructura con resumen o estructura antigua
        const comprasData = data.compras || data;
        console.log("[ComprasPage] Compras data procesada:", comprasData);
        
        // Formatear compras para el estado local, manejando valores nulos/undefined
        const comprasFormateadas = (Array.isArray(comprasData) ? comprasData : []).map((c: any) => {
          const cantidad = parseInt(c.cantidad) || 0;
          const costoUnitario = parseFloat(c.costo_unitario) || 0;
          const totalCalculado = parseFloat(c.total) || (cantidad * costoUnitario);
          
          // Formatear fecha
          let fechaFormateada = c.fecha;
          if (fechaFormateada) {
            if (typeof fechaFormateada === "string" && fechaFormateada.includes("T")) {
              fechaFormateada = fechaFormateada.split("T")[0];
            } else if (fechaFormateada instanceof Date) {
              fechaFormateada = fechaFormateada.toISOString().split("T")[0];
            }
          } else {
            fechaFormateada = new Date().toISOString().split("T")[0];
          }
          
          return {
            id: String(c.id || ""),
            producto: c.producto || c.nombre_producto || "Sin nombre",
            producto_id: c.producto_id ? String(c.producto_id) : "",
            cantidad,
            costo_unitario: costoUnitario,
            fecha: fechaFormateada,
            estado: (c.estado || "aprobada") as "aprobada" | "pendiente" | "rechazada",
            total: totalCalculado,
          };
        });
        
        console.log("[ComprasPage] Compras formateadas:", comprasFormateadas);
        console.log("[ComprasPage] Total de compras:", comprasFormateadas.length);
        setCompras(comprasFormateadas);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("[ComprasPage] Error respuesta API compras:", errorData);
        setErrorCompras(errorData.error || "Error al cargar compras. Ejecuta el script de migración en Neon.");
      }
    } catch (error: any) {
      console.error("[ComprasPage] Error al cargar compras:", error);
      setErrorCompras("Error de conexión al cargar compras");
    } finally {
      setLoadingCompras(false);
    }
  };

  const mostrarMensaje = (tipo: "success" | "error" | "warning", texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  const handleRegistrarCompra = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación del código de autorización
    if (codigo !== "1234") {
      mostrarMensaje("error", "❌ Código de autorización inválido");
      return;
    }

    // Validaciones adicionales
    if (cantidad < 1) {
      mostrarMensaje("error", "La cantidad debe ser mayor a 0");
      return;
    }

    if (costo < 0) {
      mostrarMensaje("error", "El costo no puede ser negativo");
      return;
    }

    // Validar que haya producto seleccionado o nombre de producto
    if (!productoId && !producto.trim()) {
      mostrarMensaje("error", "Debes seleccionar un producto o ingresar el nombre de un nuevo producto");
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para el backend
      const body: any = {
        cantidad,
        costo_unitario: costo,
      };

      if (productoId) {
        // Producto existente del inventario
        body.producto_id = parseInt(productoId);
      } else {
        // Nuevo producto o producto por nombre
        body.nombre_producto = producto.trim();
        if (codigoBarras.trim()) {
          body.codigo_barras = codigoBarras.trim();
        }
        if (precioVenta > 0) {
          body.precio_venta = precioVenta;
        }
      }

      // Intentar registrar en el backend
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const totalCalculado = (data.cantidad || cantidad) * (data.costo_unitario || costo);
        const compraGuardada = {
          id: String(data.id || Date.now()),
          producto: data.producto || producto,
          producto_id: String(data.producto_id || ""),
          cantidad: data.cantidad || cantidad,
          costo_unitario: parseFloat(data.costo_unitario || costo),
          fecha: data.fecha ? (typeof data.fecha === "string" ? data.fecha.split("T")[0] : new Date(data.fecha).toISOString().split("T")[0]) : new Date().toISOString().split("T")[0],
          estado: (data.estado || "aprobada") as "aprobada" | "pendiente" | "rechazada",
          total: parseFloat(data.total || totalCalculado),
        };
        
        console.log("[ComprasPage] Compra guardada recibida:", compraGuardada);
        
        // Agregar inmediatamente al estado local para actualización instantánea
        setCompras(prevCompras => {
          // Verificar que no esté duplicada
          const existe = prevCompras.some(c => c.id === compraGuardada.id);
          if (existe) {
            console.log("[ComprasPage] La compra ya existe en el estado, no se duplicará");
            return prevCompras;
          }
          console.log("[ComprasPage] Agregando compra al estado local");
          return [compraGuardada, ...prevCompras];
        });
        
        mostrarMensaje("success", "✅ Compra registrada exitosamente. El producto ha sido actualizado en el inventario.");
        
        // Recargar productos para actualizar stock
        cargarProductos();
        
        // Recargar compras después de un pequeño delay para sincronizar con la BD
        setTimeout(async () => {
          console.log("[ComprasPage] Recargando compras después de registrar nueva compra");
          await cargarCompras();
        }, 500);
        
        // Resetear formulario
        setProducto("");
        setProductoId("");
        setCantidad(0);
        setCosto(0);
        setCodigo("");
        setCodigoBarras("");
        setPrecioVenta(0);
        setCrearNuevoProducto(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error en el servidor");
      }
    } catch (error: any) {
      console.error("Error al registrar compra:", error);
      mostrarMensaje("error", `❌ Error al registrar compra: ${error.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar planilla
  const descargarPlanilla = async (tipo: "hoy" | "mes" | "todas") => {
    try {
      let fecha = "";
      let mes = "";
      let año = "";
      
      if (tipo === "hoy") {
        fecha = new Date().toISOString().split("T")[0];
      } else if (tipo === "mes") {
        const ahora = new Date();
        mes = String(ahora.getMonth() + 1);
        año = String(ahora.getFullYear());
      }

      const params = new URLSearchParams();
      if (fecha) params.append("fecha", fecha);
      if (mes) params.append("mes", mes);
      if (año) params.append("año", año);

      const res = await fetch(`/api/compras?${params.toString()}`);
      if (res.ok) {
        const comprasData = await res.json();
        
        // Formatear datos para Excel
        const datosExcel = comprasData.map((c: any) => ({
          "Producto": c.producto,
          "Cantidad": c.cantidad,
          "Costo Unitario": c.costo_unitario,
          "Total": (c.cantidad * c.costo_unitario).toFixed(2),
          "Fecha": c.fecha
        }));

        // Agregar totales
        const total = comprasData.reduce((acc: number, c: any) => acc + (c.cantidad * c.costo_unitario), 0);
        datosExcel.push({
          "Producto": "TOTAL",
          "Cantidad": comprasData.reduce((acc: number, c: any) => acc + c.cantidad, 0),
          "Costo Unitario": "",
          "Total": total.toFixed(2),
          "Fecha": ""
        });

        const nombreArchivo = tipo === "hoy" 
          ? `planilla_compras_${fecha}`
          : tipo === "mes"
          ? `planilla_compras_${mes}_${año}`
          : `planilla_compras_completa_${new Date().toISOString().split("T")[0]}`;

        exportToExcel(datosExcel, nombreArchivo);
        mostrarMensaje("success", `✅ Planilla descargada: ${nombreArchivo}.xlsx`);
      } else {
        throw new Error("Error al obtener compras");
      }
    } catch (error: any) {
      console.error("Error al descargar planilla:", error);
      mostrarMensaje("error", `❌ Error al descargar planilla: ${error.message}`);
    }
  };

  // Filtrar compras por fecha
  const comprasPorFecha = compras.filter((c) => {
    if (filtroFecha === "todos") return true;
    const fechaCompra = new Date(c.fecha);
    const hoy = new Date();
    
    if (filtroFecha === "hoy") {
      return fechaCompra.toDateString() === hoy.toDateString();
    }
    
    if (filtroFecha === "mes") {
      return fechaCompra.getMonth() === hoy.getMonth() && 
             fechaCompra.getFullYear() === hoy.getFullYear();
    }
    
    return true;
  });

  // Filtrar compras por historial
  const comprasFiltradas = comprasPorFecha.filter((compra) => {
    const matchesSearch = compra.producto.toLowerCase().includes(searchHistorial.toLowerCase());
    const matchesEstado = filterEstado === "todos" || compra.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  // Filtrar productos por búsqueda (para el selector de productos)
  const productosFiltrados = productos.filter((p) => 
    p.nombre.toLowerCase().includes(searchProducto.toLowerCase()) ||
    p.id.toLowerCase().includes(searchProducto.toLowerCase()) ||
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(searchProducto.toLowerCase()))
  );

  // Calcular totales - usar todas las compras para estadísticas generales
  // El monto total debe reflejar todas las compras, no solo las filtradas por fecha
  const totalCompras = useMemo(() => {
    const total = compras.reduce((acc, c) => {
      const compraTotal = (c as any).total || ((c.cantidad || 0) * (c.costo_unitario || 0));
      return acc + (isNaN(compraTotal) ? 0 : compraTotal);
    }, 0);
    console.log("[ComprasPage] Calculando totalCompras:", {
      numCompras: compras.length,
      compras: compras.map(c => ({
        id: c.id,
        cantidad: c.cantidad,
        costo: c.costo_unitario,
        total: (c as any).total || (c.cantidad * c.costo_unitario)
      })),
      totalCalculado: total
    });
    return total;
  }, [compras]);
  
  // Total de compras aprobadas (todas, no solo filtradas)
  const comprasAprobadas = useMemo(() => {
    const aprobadas = compras.filter(c => c.estado === "aprobada").length;
    console.log("[ComprasPage] Calculando comprasAprobadas:", {
      totalCompras: compras.length,
      aprobadas,
      estados: compras.map(c => ({ id: c.id, estado: c.estado }))
    });
    return aprobadas;
  }, [compras]);
  
  // Total de compras (todas)
  const totalComprasCount = compras.length;
  
  // Monto total filtrado por fecha (para mostrar en la tarjeta si hay filtro)
  const montoTotalFiltrado = useMemo(() => {
    const total = comprasPorFecha.reduce((acc, c) => {
      const compraTotal = (c as any).total || ((c.cantidad || 0) * (c.costo_unitario || 0));
      return acc + (isNaN(compraTotal) ? 0 : compraTotal);
    }, 0);
    return total;
  }, [comprasPorFecha]);
  const productoSeleccionado = productos.find(p => p.id === productoId);

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

  const getMensajeColor = (tipo: string) => {
    switch (tipo) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400";
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

        {/* Mensaje de notificación */}
        {mensaje && (
          <div className={`p-4 rounded-lg border ${getMensajeColor(mensaje.tipo)} flex items-center gap-2`}>
            {mensaje.tipo === "success" && <FaCheckCircle />}
            {mensaje.tipo === "error" && <FaExclamationTriangle />}
            {mensaje.tipo === "warning" && <FaExclamationTriangle />}
            <span className="font-medium">{mensaje.texto}</span>
          </div>
        )}

        {/* Mensaje de error si falla la carga de compras */}
        {errorCompras && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-red-500 dark:text-red-400 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300">Error al cargar compras</p>
                <p className="text-red-700 dark:text-red-400 text-sm">{errorCompras}</p>
                <p className="text-red-600 dark:text-red-500 text-xs mt-2">
                  Ejecuta el script SQL en Neon Console: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">scripts/fix-compras-table.sql</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">Total Compras</h3>
            <p className="text-3xl font-bold mt-2">
              {loadingCompras ? (
                <span className="animate-pulse">...</span>
              ) : (
                totalComprasCount
              )}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">Aprobadas</h3>
            <p className="text-3xl font-bold mt-2">
              {loadingCompras ? (
                <span className="animate-pulse">...</span>
              ) : (
                comprasAprobadas
              )}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">
              Monto Total {filtroFecha !== "todos" && `(${filtroFecha === "hoy" ? "Hoy" : "Este Mes"})`}
            </h3>
            <p className="text-3xl font-bold mt-2">
              {loadingCompras ? (
                <span className="animate-pulse">...</span>
              ) : (
                `$${(filtroFecha !== "todos" ? montoTotalFiltrado : totalCompras).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-600 dark:to-orange-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">Productos</h3>
            <p className="text-3xl font-bold mt-2">{productos.length}</p>
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
                {/* Buscador de productos (si hay productos cargados) */}
                {productos.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Buscar Producto en Inventario
                    </label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, código de barras o ID..."
                        value={searchProducto}
                        onChange={(e) => setSearchProducto(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

                {/* Selector de producto del inventario - ✅ MEJORADO CON CÓDIGO DE BARRAS */}
                {productos.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Producto del Inventario
                    </label>
                    <select
                      value={productoId}
                      onChange={(e) => {
                        setProductoId(e.target.value);
                        const prod = productos.find(p => p.id === e.target.value);
                        if (prod) {
                          setProducto(prod.nombre);
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">Selecciona un producto</option>
                      {productosFiltrados.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codigo_barras ? `[${p.codigo_barras}] ` : ''}
                          {p.nombre} - Stock: {p.stock}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Información del producto seleccionado - ✅ MEJORADO CON CÓDIGO DE BARRAS */}
                {productoSeleccionado && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <FaBox />
                      <span className="text-sm font-medium">{productoSeleccionado.nombre}</span>
                    </div>
                    {productoSeleccionado.codigo_barras && (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <FaBarcode />
                        <span className="text-xs font-mono">{productoSeleccionado.codigo_barras}</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Stock actual: <span className="font-semibold">{productoSeleccionado.stock} unidades</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Precio de venta: <span className="font-semibold">${productoSeleccionado.precio}</span>
                    </p>
                  </div>
                )}

                {/* Opción para crear nuevo producto */}
                {productos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="crearNuevo"
                      checked={crearNuevoProducto}
                      onChange={(e) => {
                        setCrearNuevoProducto(e.target.checked);
                        if (e.target.checked) {
                          setProductoId("");
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="crearNuevo" className="text-sm text-gray-700 dark:text-gray-300">
                      Crear nuevo producto o agregar a existente
                    </label>
                  </div>
                )}

                {/* Campo manual de producto (si no hay en inventario o se selecciona crear nuevo) */}
                {(productos.length === 0 || !productoId || crearNuevoProducto) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Producto {productos.length > 0 ? "(buscará por nombre o creará nuevo)" : ""}
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre del producto"
                        value={producto}
                        onChange={(e) => setProducto(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                        required={!productoId}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Código de Barras (opcional)
                      </label>
                      <div className="relative">
                        <FaBarcode className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          placeholder="Código de barras"
                          value={codigoBarras}
                          onChange={(e) => setCodigoBarras(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Precio de Venta (opcional, se calculará automáticamente si no se especifica)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={precioVenta || ""}
                          onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Si no se especifica, se calculará como: Costo × 1.5 (50% margen)
                      </p>
                    </div>
                  </>
                )}

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
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total estimado:</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${(cantidad * costo).toFixed(2)}
                    </p>
                    {productoSeleccionado && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Stock después de compra: {productoSeleccionado.stock + cantidad} unidades
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white py-3 px-4 rounded-lg font-medium shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Registrar Compra
                    </>
                  )}
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
                  <div className="flex flex-wrap gap-2">
                    {compras.length > 0 && (
                      <>
                        <button
                          onClick={() => descargarPlanilla("hoy")}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
                        >
                          <FaFileExcel />
                          Planilla Hoy
                        </button>
                        <button
                          onClick={() => descargarPlanilla("mes")}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
                        >
                          <FaFileExcel />
                          Planilla Mes
                        </button>
                        <button
                          onClick={() => descargarPlanilla("todas")}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
                        >
                          <FaFileExcel />
                          Todas las Compras
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Buscar producto en compras..."
                      value={searchHistorial}
                      onChange={(e) => setSearchHistorial(e.target.value)}
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
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                    <select
                      value={filtroFecha}
                      onChange={(e) => setFiltroFecha(e.target.value as "todos" | "hoy" | "mes")}
                      className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="todos">Todas las fechas</option>
                      <option value="hoy">Hoy</option>
                      <option value="mes">Este mes</option>
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
                      Total mostrado: ${comprasFiltradas.reduce((acc, c) => acc + (c.cantidad * c.costo_unitario), 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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