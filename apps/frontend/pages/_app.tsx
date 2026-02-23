// apps/frontend/pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Layout from '../components/layout';
import { Component, ErrorInfo, ReactNode, useEffect } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Algo salió mal
            </h1>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Ejecutar migraciones automáticamente — versionar la clave para que nuevas migraciones corran
  useEffect(() => {
    const MIG_VERSION = "v5"; // Incrementar al agregar nuevas migraciones
    const key = `_spm_mig_${MIG_VERSION}`;
    if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
      fetch("/api/migrate", { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          console.log("Migraciones:", data.results);
          sessionStorage.setItem(key, "1");
        })
        .catch((err) => console.error("Migration error:", err));
    }
  }, []);

  // Páginas que NO deben tener el Layout (páginas públicas)
  const publicPages = ['/login', '/', '/404'];

  // Si estamos en una página pública, NO usar el Layout
  const isPublicPage = publicPages.includes(router.pathname);

  if (isPublicPage) {
    return (
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    );
  }

  // Para todas las demás páginas (protegidas), usar el Layout
  return (
    <ErrorBoundary>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ErrorBoundary>
  );
}

export default MyApp;