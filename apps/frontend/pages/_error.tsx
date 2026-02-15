// apps/frontend/pages/_error.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';

interface ErrorProps {
  statusCode: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

interface ErrorInitialProps {
  res?: { statusCode?: number };
  err?: Error & { statusCode?: number };
}

function Error({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  if (!hasGetInitialPropsRun && err) {
    // getInitialProps is not called in case of
    // https://github.com/vercel/next.js/issues/8592. As a workaround, we pass
    // err via _app.tsx so it can be captured
  }

  return (
    <>
      <Head>
        <title>Error {statusCode || 'Desconocido'} - VEROKAI POS</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        {/* Formas decorativas de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-400/20 dark:bg-red-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400/20 dark:bg-orange-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative w-full max-w-md text-center animate-fadeIn">
          {/* Icono de error */}
          <div className="inline-block p-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-2xl mb-6">
            <FaExclamationTriangle className="text-white text-5xl" />
          </div>

          {/* Mensaje de error */}
          <h1 className="text-6xl font-bold text-gray-800 dark:text-white mb-4">
            {statusCode || '?'}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {statusCode === 404
              ? 'Página no encontrada'
              : statusCode === 500
              ? 'Error del servidor'
              : 'Algo salió mal'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {statusCode === 404
              ? 'La página que buscas no existe o ha sido movida.'
              : statusCode === 500
              ? 'Ocurrió un error en el servidor. Por favor, intenta más tarde.'
              : 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
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

Error.getInitialProps = ({ res, err }: ErrorInitialProps) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, hasGetInitialPropsRun: true };
};

export default Error;

