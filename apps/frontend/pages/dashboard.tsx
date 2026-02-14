// apps/frontend/pages/dashboard.tsx
import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { exportToExcel } from "../utils/exportExcel";
import { FaBox, FaShoppingCart, FaClipboardList, FaChartBar, FaDownload } from "react-icons/fa";

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    if (!userRole) {
      router.push("/login");
    } else {
      setRole(userRole);
    }
  }, [router]);

  const renderContent = () => {
    switch (role) {
      case "jefe":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Panel del Jefe</h2>
            <p className="mb-6 text-gray-600">
              Accede a los módulos principales del sistema:
            </p>

            {/* Grid de módulos */}
            <div className="grid grid-cols-2 gap-6">
              <Link href="/productos">
                <div className="bg-blue-100 hover:bg-blue-200 cursor-pointer rounded-lg shadow-md p-6 flex flex-col items-center">
                  <FaBox className="text-blue-600 text-3xl mb-2" />
                  <span className="font-semibold text-gray-700">Productos</span>
                </div>
              </Link>

              <Link href="/ventas">
                <div className="bg-green-100 hover:bg-green-200 cursor-pointer rounded-lg shadow-md p-6 flex flex-col items-center">
                  <FaShoppingCart className="text-green-600 text-3xl mb-2" />
                  <span className="font-semibold text-gray-700">Ventas</span>
                </div>
              </Link>

              <Link href="/compras">
                <div className="bg-yellow-100 hover:bg-yellow-200 cursor-pointer rounded-lg shadow-md p-6 flex flex-col items-center">
                  <FaClipboardList className="text-yellow-600 text-3xl mb-2" />
                  <span className="font-semibold text-gray-700">Compras</span>
                </div>
              </Link>

              <Link href="/reportes">
                <div className="bg-purple-100 hover:bg-purple-200 cursor-pointer rounded-lg shadow-md p-6 flex flex-col items-center">
                  <FaChartBar className="text-purple-600 text-3xl mb-2" />
                  <span className="font-semibold text-gray-700">Reportes</span>
                </div>
              </Link>
            </div>

            {/* Exportación general */}
            <div className="mt-8 bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2 text-gray-800">Copia de seguridad</h3>
              <p className="text-gray-600 mb-4">
                Descarga los datos actuales en Excel:
              </p>
              <button
                onClick={() =>
                  exportToExcel(
                    [
                      { modulo: "Productos", fecha: new Date().toISOString() },
                      { modulo: "Ventas", fecha: new Date().toISOString() },
                      { modulo: "Compras", fecha: new Date().toISOString() },
                      { modulo: "Reportes", fecha: new Date().toISOString() },
                    ],
                    "backup_general"
                  )
                }
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <FaDownload /> Exportar todo a Excel
              </button>
            </div>
          </div>
        );

      case "almacen":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Panel de Almacén</h2>
            <Link href="/compras">
              <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Registrar entrada de stock
              </button>
            </Link>
          </div>
        );

      case "cajero":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Panel del Cajero</h2>
            <Link href="/ventas">
              <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Registrar ventas
              </button>
            </Link>
          </div>
        );

      default:
        return <p>Cargando...</p>;
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard - VEROKAI POS</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 w-full max-w-3xl">
          <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
            Dashboard
          </h1>
          {renderContent()}
        </div>
      </main>
    </>
  );
}
