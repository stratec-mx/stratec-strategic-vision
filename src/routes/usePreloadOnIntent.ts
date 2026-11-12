// Adelanta la descarga de una página cuando el visitante acerca el cursor, el
// dedo o el teclado a un enlace interno. Al hacer clic la página casi siempre
// ya está lista y se muestra sin pasar por el aviso de "Cargando…".
import { useEffect } from "react";
import { preloadRoute } from "./preloadRoute";

type ConnectionInfo = { saveData?: boolean };

export function usePreloadOnIntent() {
  useEffect(() => {
    // Con ahorro de datos activado no se descarga nada por adelantado
    const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
    if (connection?.saveData) return;

    const requested = new Set<string>();
    const onIntent = (event: Event) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.origin !== window.location.origin || link.target === "_blank" || link.hasAttribute("download")) return;
      const { pathname } = link;
      if (pathname === window.location.pathname || requested.has(pathname)) return;
      requested.add(pathname);
      // Si falla, se olvida para poder intentarlo otra vez; el clic sigue su curso normal
      preloadRoute(pathname).catch(() => requested.delete(pathname));
    };

    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);
    return () => {
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("focusin", onIntent);
    };
  }, []);
}
