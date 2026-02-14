// apps/frontend/components/layout.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaBell } from "react-icons/fa";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [role, setRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    if (!userRole) {
      router.push("/login");
    } else {
      setRole(userRole);

      // Simulación de notificaciones según rol
      if (userRole === "jefe") {
        setNotifications([
          "Stock bajo en Leche (2 unidades)",
          "Ventas de hoy: $45",
          "Compra pendiente de autorización",
        ]);
      } else if (userRole === "almacen") {
        setNotifications(["Stock bajo en Coca Cola (1 unidad)"]);
      } else if (userRole === "cajero") {
        setNotifications(["Venta registrada correctamente"]);
      }
    }
  }, [router]);

  const renderLinks = () => {
    switch (role) {
      case "jefe":
        return (
          <>
            <Link href="/dashboard">
              <span className="cursor-pointer hover:text-blue-200">Dashboard</span>
            </Link>
            <Link href="/productos">
              <span className="cursor-pointer hover:text-blue-200">Productos</span>
            </Link>
            <Link href="/ventas">
              <span className="cursor-pointer hover:text-blue-200">Ventas</span>
            </Link>
            <Link href="/compras">
              <span className="cursor-pointer hover:text-blue-200">Compras</span>
            </Link>
            <Link href="/reportes">
              <span className="cursor-pointer hover:text-blue-200">Reportes</span>
            </Link>
          </>
        );
      case "almacen":
        return (
          <>
            <Link href="/dashboard">
              <span className="cursor-pointer hover:text-blue-200">Dashboard</span>
            </Link>
            <Link href="/compras">
              <span className="cursor-pointer hover:text-blue-200">Compras</span>
            </Link>
          </>
        );
      case "cajero":
        return (
          <>
            <Link href="/dashboard">
              <span className="cursor-pointer hover:text-blue-200">Dashboard</span>
            </Link>
            <Link href="/ventas">
              <span className="cursor-pointer hover:text-blue-200">Ventas</span>
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-700 text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-6">VEROKAI POS</h2>
        <nav className="flex flex-col gap-4">{renderLinks()}</nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Panel Administrativo</h1>
          <div className="flex items-center gap-4">
            {/* Notificaciones */}
            <div className="relative">
              <FaBell className="text-gray-700 text-2xl cursor-pointer" />
              {notifications.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-2">
                  {notifications.length}
                </span>
              )}
              {/* Dropdown de notificaciones */}
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-10">
                <h3 className="font-bold mb-2">Notificaciones</h3>
                {notifications.length === 0 ? (
                  <p className="text-gray-600">No hay notificaciones</p>
                ) : (
                  <ul className="list-disc pl-6 text-gray-700">
                    {notifications.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Botón cerrar sesión */}
            <button
              onClick={() => {
                localStorage.removeItem("role");
                window.location.href = "/login";
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
