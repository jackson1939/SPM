// apps/frontend/pages/index.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  FaBox,
  FaShoppingCart,
  FaChartBar,
  FaUserShield,
  FaRocket,
  FaMobile,
  FaCloud,
  FaArrowRight,
} from "react-icons/fa";

export default function Home() {
  const features = [
    {
      icon: FaBox,
      title: "Gestión de Inventario",
      description: "Control total de tus productos y stock en tiempo real",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: FaShoppingCart,
      title: "Punto de Venta",
      description: "Sistema POS rápido y eficiente para procesar ventas",
      color: "from-green-500 to-green-600",
    },
    {
      icon: FaChartBar,
      title: "Reportes y Análisis",
      description: "Estadísticas detalladas para tomar mejores decisiones",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: FaUserShield,
      title: "Control de Acceso",
      description: "Diferentes roles y permisos para tu equipo",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: FaRocket,
      title: "Alto Rendimiento",
      description: "Sistema optimizado para operaciones rápidas",
      color: "from-pink-500 to-pink-600",
    },
    {
      icon: FaMobile,
      title: "Responsive",
      description: "Funciona perfectamente en cualquier dispositivo",
      color: "from-indigo-500 to-indigo-600",
    },
  ];

  return (
    <>
      <Head>
        <title>SPM - Sistema de Punto de Venta</title>
        <meta name="description" content="Sistema modular de gestión de ventas e inventario" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Formas decorativas de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative">
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center animate-fadeIn">
              {/* Logo/Badge */}
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl mb-8">
                <FaCloud className="text-white text-6xl" />
              </div>

              {/* Título principal */}
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                Bienvenido a{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  SPM
                </span>
              </h1>

              {/* Subtítulo */}
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Sistema modular profesional para gestión de{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  productos
                </span>
                ,{" "}
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ventas
                </span>{" "}
                y{" "}
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  reportes
                </span>
              </p>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link href="/login">
                  <button className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 text-lg font-bold">
                    Iniciar Sesión
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/reportes">
                  <button className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-white border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg font-semibold">
                    <FaChartBar />
                    Ver Reportes
                  </button>
                </Link>
              </div>

              {/* Badges informativos */}
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Sistema Activo
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200 dark:border-gray-700">
                  <FaUserShield className="text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Multi-Usuario
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200 dark:border-gray-700">
                  <FaCloud className="text-purple-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    En la Nube
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Características Principales
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Todo lo que necesitas para gestionar tu negocio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-2 animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="text-white text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-3xl shadow-2xl p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para comenzar?
              </h2>
              <p className="text-xl text-blue-100 dark:text-blue-200 mb-8 max-w-2xl mx-auto">
                Accede al sistema y empieza a gestionar tu negocio de manera más eficiente
              </p>
              <Link href="/login">
                <button className="group flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-50 text-blue-600 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 text-lg font-bold mx-auto">
                  Comenzar Ahora
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <FaCloud className="text-blue-500 text-2xl" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  SPM
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                © 2026 VEROKAI. Todos los derechos reservados.
              </p>
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Soporte
                </button>
                <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Documentación
                </button>
                <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Contacto
                </button>
              </div>
            </div>
          </footer>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
}