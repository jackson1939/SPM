// apps/frontend/pages/scan.tsx — Búsqueda de producto por código de barras
import { useState } from "react";
import { useRoleGuard } from "../hooks/useRoleGuard";
import AccesoDenegado from "../components/AccesoDenegado";

export default function Scan() {
  const { authorized, loading: guardLoading } = useRoleGuard(["jefe", "almacen", "cajero"]);
  const [codigo, setCodigo] = useState("");
  const [producto, setProducto] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarProducto = async () => {
    if (!codigo.trim()) return;
    setBuscando(true);
    setError(null);
    setProducto(null);
    try {
      // Usar la API interna de Next.js — no URLs hardcodeadas a servicios externos
      const res = await fetch(`/api/productos`);
      if (!res.ok) throw new Error("Error al obtener productos");
      const productos: any[] = await res.json();
      const encontrado = productos.find(
        (p) =>
          p.codigo_barras &&
          p.codigo_barras.trim().toLowerCase() === codigo.trim().toLowerCase()
      );
      if (encontrado) {
        setProducto(encontrado);
      } else {
        setError(`No se encontró ningún producto con el código "${codigo}"`);
      }
    } catch {
      setError("Error de conexión al buscar el producto");
    } finally {
      setBuscando(false);
    }
  };

  if (guardLoading) return null;
  if (!authorized) return <AccesoDenegado requiredRoles={["jefe", "almacen", "cajero"]} />;

  return (
    <div style={{ padding: "2rem", maxWidth: 500 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Escanear producto
      </h1>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Código de barras"
          value={codigo}
          onChange={(e) => { setCodigo(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && buscarProducto()}
          style={{ flex: 1, padding: "0.5rem", border: "1px solid #ccc", borderRadius: 6 }}
        />
        <button
          onClick={buscarProducto}
          disabled={buscando || !codigo.trim()}
          style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", borderRadius: 6, border: "none", cursor: "pointer" }}
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && (
        <p style={{ color: "#dc2626", marginBottom: "0.5rem" }}>{error}</p>
      )}

      {producto && (
        <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb" }}>
          <h2 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>{producto.nombre}</h2>
          <p>Precio: ${producto.precio}</p>
          <p>Stock: {producto.stock} unidades</p>
          {producto.categoria && <p>Categoría: {producto.categoria}</p>}
          {producto.codigo_barras && <p style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#6b7280" }}>Código: {producto.codigo_barras}</p>}
        </div>
      )}
    </div>
  );
}
