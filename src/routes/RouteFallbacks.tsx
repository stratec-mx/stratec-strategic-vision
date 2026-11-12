// Lo que se ve mientras llega el archivo de una página.

/** Panel interno (/app) y demo del mapa. */
export const CargandoPanel = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">Cargando…</div>
);

/**
 * Páginas públicas, al navegar dentro del sitio. Ocupa la pantalla completa con
 * el fondo oscuro de las páginas para que nada salte. El texto aparece solo si
 * la descarga tarda, así una navegación normal no parpadea.
 */
export const CargandoPagina = () => (
  <div className="min-h-screen flex items-center justify-center bg-navy-deep" role="status" aria-live="polite">
    <span className="text-sm text-smoke/60 animate-in fade-in duration-300 delay-700 fill-mode-both">Cargando…</span>
  </div>
);
