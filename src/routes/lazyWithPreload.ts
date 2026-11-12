// Página que se descarga aparte (su propio archivo) y que además se puede
// pedir por adelantado con `preload()`.
//
// Por qué no basta `React.lazy`: aunque el archivo ya esté descargado, `lazy`
// suspende en su primer render y muestra el respaldo de Suspense un instante.
// Aquí, si la página ya se cargó, se pinta directo desde el primer render; así
// el HTML prerenderizado se reemplaza por la página real, sin pantalla vacía.
import { createElement, lazy, useRef, type ComponentType, type ReactElement } from "react";

type PageModule = { default: ComponentType };

export type PreloadablePage = {
  (): ReactElement;
  /** Descarga la página sin pintarla. Se puede llamar varias veces. */
  preload: () => Promise<void>;
};

export function lazyWithPreload(loader: () => Promise<PageModule>): PreloadablePage {
  let loaded: ComponentType | undefined;
  let pending: Promise<PageModule> | undefined;

  const load = () => {
    if (!pending) {
      const attempt = loader().then((mod) => {
        loaded = mod.default;
        return mod;
      });
      // Si la descarga falla, el siguiente intento vuelve a pedir el archivo
      attempt.catch(() => {
        if (pending === attempt) pending = undefined;
      });
      pending = attempt;
    }
    return pending;
  };

  const Lazy = lazy(load);

  const Page = () => {
    // Se decide una sola vez por montaje: cambiar de componente a media vida
    // desmontaría la página y borraría lo que el visitante ya escribió.
    const chosen = useRef<ComponentType>(loaded ?? Lazy);
    return createElement(chosen.current);
  };
  Page.preload = () => load().then(() => undefined);

  return Page;
}

export const isPreloadable = (value: unknown): value is PreloadablePage =>
  typeof value === "function" && typeof (value as Partial<PreloadablePage>).preload === "function";
