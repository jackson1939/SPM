// apps/frontend/pages/404.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaSearch, FaHome, FaArrowLeft } from 'react-icons/fa';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Página no encontrada - VEROKAI POS</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        {/* Formas decorativas de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative w-full max-w-md text-center animate-fadeIn">
          {/* Icono */}
          <div className="inline-block p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl mb-6">
            <FaSearch className="text-white text-5xl" />
          </div>

          {/* Mensaje */}
          <h1 className="text-6xl font-bold text-gray-800 dark:text-white mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Página no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaHome />
              Ir al Dashboard
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaArrowLeft />
              Volver
            </button>
          </div>
        </div>

        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
          }
        `}</style>
      </main>
    </>
  );
}

