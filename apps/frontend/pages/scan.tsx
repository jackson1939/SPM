// apps/frontend/pages/scan.tsx
import { useState } from "react";

export default function Scan() {
  const [codigo, setCodigo] = useState("");
  const [producto, setProducto] = useState<any>(null);

  const buscarProducto = async () => {
    const res = await fetch(`https://tu-backend.vercel.app/productos/codigo/${codigo}`);
    const data = await res.json();
    setProducto(data);
  };

  return (
    <div>
      <h1>Escanear producto</h1>
      <input
        type="text"
        placeholder="Código de barras"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
      />
      <button onClick={buscarProducto}>Buscar</button>

      {producto && (
        <div>
          <h2>{producto.nombre}</h2>
          <p>Precio: ${producto.precio}</p>
          <p>Tipo: {producto.tipo}</p>
          <p>Contenido: {producto.contenido}</p>
        </div>
      )}
    </div>
  );
}