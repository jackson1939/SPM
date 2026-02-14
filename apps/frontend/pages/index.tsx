// apps/frontend/pages/index.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>SPM sistema de ventas</title>
        <meta name="description" content="Sistema de gestión de ventas e inventario" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">
          Bienvenido a SPM
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Sistema modular para gestión de productos, ventas y reportes.
        </p>
        <div className="flex gap-4">
          <Link href="/login">
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Iniciar sesión
            </button>
          </Link>
          <Link href="/reportes">
            <button className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Ver reportes
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}