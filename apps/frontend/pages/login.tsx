// apps/frontend/pages/login.tsx
import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cajero"); // valor por defecto
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulación: guardamos el rol en localStorage
    localStorage.setItem("role", role);
    router.push("/dashboard");
  };

  return (
    <>
      <Head>
        <title>Login - VEROKAI POS</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-96">
          <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">
            Iniciar Sesión
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                placeholder="Ingrese su usuario"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                placeholder="********"
                required
              />
            </div>

            {/* Selección de rol */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Rol
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border rounded w-full py-2 px-3"
              >
                <option value="jefe">Jefe</option>
                <option value="almacen">Encargado de almacén</option>
                <option value="cajero">Cajero</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Entrar
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
