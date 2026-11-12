// Red de seguridad para las páginas que se descargan aparte.
// Caso típico: el visitante tiene el sitio abierto, se publica una versión
// nueva y el archivo de la página que pide ya no existe. Se recarga una vez
// para traer la versión vigente; si vuelve a fallar se muestra un aviso en
// lugar de dejar la pantalla en blanco.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { CargandoPagina } from "./RouteFallbacks";

const RELOAD_KEY = "stratec_recarga_pagina";
const RELOAD_WINDOW_MS = 30_000;
const CHUNK_ERROR = /dynamically imported module|importing a module script failed|unable to preload css|chunkloaderror/i;

const isChunkLoadError = (error: unknown) => CHUNK_ERROR.test(error instanceof Error ? `${error.name} ${error.message}` : String(error));

/** Verdadero si no se ha recargado hace poco (evita un ciclo de recargas). */
function canAutoReload() {
  try {
    return Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) ?? 0) > RELOAD_WINDOW_MS;
  } catch {
    return false; // sin almacenamiento no hay forma de saber si ya se recargó
  }
}

interface Props {
  /** Al cambiar (por ejemplo, la dirección actual) se vuelve a intentar pintar. */
  resetKey: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
  /** El error fue un archivo que no descargó (red o versión nueva), no un error de código. */
  chunk: boolean;
  reloading: boolean;
  resetKey: string;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, chunk: false, reloading: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    const chunk = isChunkLoadError(error);
    return { failed: true, chunk, reloading: chunk && canAutoReload() };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey === state.resetKey) return null;
    return { failed: false, chunk: false, reloading: false, resetKey: props.resetKey };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("No se pudo mostrar la página:", error, info.componentStack);
    if (!this.state.reloading) return;
    try {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      /* canAutoReload ya descartó este caso */
    }
    window.location.reload();
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.state.reloading) return <CargandoPagina />;
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-deep px-6" role="alert">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-smoke">{this.state.chunk ? "No pudimos cargar esta página" : "Ocurrió un error en esta página"}</h1>
          <p className="mt-3 text-sm text-smoke/70">{this.state.chunk ? "Revisa tu conexión a internet y vuelve a intentarlo." : "Vuelve a cargarla. Si el error sigue, avísanos."}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center justify-center rounded-none border border-olive px-6 py-3 text-xs uppercase tracking-widest text-smoke hover:bg-olive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive"
          >
            Volver a cargar
          </button>
        </div>
      </div>
    );
  }
}
