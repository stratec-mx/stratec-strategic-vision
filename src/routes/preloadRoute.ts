// Decide qué página pública corresponde a una dirección y la descarga por
// adelantado. Usa la misma tabla y el mismo criterio de React Router que
// <Routes>, así que no hay una segunda lista que mantener.
import { isValidElement } from "react";
import { Navigate, matchRoutes, resolvePath, type RouteObject } from "react-router-dom";
import { isPreloadable, type PreloadablePage } from "./lazyWithPreload";
import { routeObjects } from "./routes";

const MAX_REDIRECTS = 5;

/**
 * Páginas que se pintarán al abrir `pathname`. Sigue las redirecciones
 * (<Navigate>) hasta su destino. El panel interno (/app) y la demo del mapa no
 * devuelven nada: conservan su carga diferida con su propio aviso de "Cargando…".
 */
export function pagesFor(pathname: string, routes: RouteObject[] = routeObjects, redirects = 0): PreloadablePage[] {
  const pages: PreloadablePage[] = [];
  for (const match of matchRoutes(routes, pathname) ?? []) {
    const element = match.route.element;
    if (!isValidElement(element)) continue;
    if (element.type === Navigate) {
      if (redirects >= MAX_REDIRECTS) continue;
      const to = (element.props as { to: string | { pathname?: string } }).to;
      const target = resolvePath(to, match.pathname).pathname;
      pages.push(...pagesFor(target, routes, redirects + 1));
    } else if (isPreloadable(element.type)) {
      pages.push(element.type);
    }
  }
  return pages;
}

/** Descarga las páginas de `pathname`. Nunca lanza error de forma síncrona. */
export async function preloadRoute(pathname: string, routes: RouteObject[] = routeObjects): Promise<void> {
  await Promise.all(pagesFor(pathname, routes).map((page) => page.preload()));
}
