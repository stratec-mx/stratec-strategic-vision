import { Suspense, useState } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Navigate, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { buildRoutes } from "@/prerender/routes";
import { lazyWithPreload } from "./lazyWithPreload";
import { CoverageLocality, DictamenSeguridad, Index, NotFound, VideovigilanciaCctv } from "./pages";
import { pagesFor, preloadRoute } from "./preloadRoute";
import { routeElements, routeObjects } from "./routes";

describe("pagesFor: qué página se descarga antes de montar", () => {
  it("resuelve rutas fijas y con barra final", () => {
    expect(pagesFor("/")).toEqual([Index]);
    expect(pagesFor("/servicios/videovigilancia-cctv")).toEqual([VideovigilanciaCctv]);
    expect(pagesFor("/servicios/videovigilancia-cctv/")).toEqual([VideovigilanciaCctv]);
  });

  it("resuelve rutas dinámicas de cobertura", () => {
    expect(pagesFor("/cobertura/morelos")).toEqual([CoverageLocality]);
    expect(pagesFor("/cobertura/morelos/cuernavaca")).toEqual([CoverageLocality]);
  });

  it("sigue las redirecciones hasta la página de destino", () => {
    expect(pagesFor("/servicios/determinacion-seguridad")).toEqual([DictamenSeguridad]);
  });

  it("usa la página de no encontrado para direcciones desconocidas", () => {
    expect(pagesFor("/no-existe")).toEqual([NotFound]);
    expect(pagesFor("/cobertura/morelos/cuernavaca/de-mas")).toEqual([NotFound]);
  });

  it("no adelanta nada del panel interno ni de la demo del mapa", () => {
    expect(pagesFor("/app")).toEqual([]);
    expect(pagesFor("/app/leads")).toEqual([]);
    expect(pagesFor("/app/documents/123")).toEqual([]);
    expect(pagesFor("/admin/leads")).toEqual([]);
    expect(pagesFor("/mapa-demo")).toEqual([]);
  });

  it("no se queda en un ciclo si dos rutas se redirigen entre sí", () => {
    const loop = [
      { path: "/a", element: <Navigate to="/b" replace /> },
      { path: "/b", element: <Navigate to="/a" replace /> },
    ];
    expect(pagesFor("/a", loop)).toEqual([]);
  });

  // Si alguien agrega una página prerenderizada y olvida su ruta (o al revés),
  // el HTML estático se cambiaría por la página de "no encontrado".
  it("cada página prerenderizada tiene una página propia en la tabla de rutas", () => {
    const sinPagina = buildRoutes()
      .map((r) => r.path)
      .filter((path) => {
        const pages = pagesFor(path);
        return pages.length !== 1 || pages[0] === NotFound;
      });
    expect(sinPagina).toEqual([]);
  });

  it("todas las rutas públicas de la tabla se pueden descargar por adelantado", () => {
    const publicas = routeObjects.filter((r) => r.path && r.path !== "*" && !r.path.startsWith("/app") && r.path !== "/admin/leads" && r.path !== "/mapa-demo");
    expect(publicas.length).toBeGreaterThan(25);
    for (const r of publicas) {
      const path = r.path!.replace(":state", "morelos").replace(":city", "cuernavaca");
      expect(pagesFor(path), path).toHaveLength(1);
    }
  });
});

describe("lazyWithPreload", () => {
  const Fake = () => <p>contenido real</p>;

  it("pinta la página desde el primer render si ya se descargó", async () => {
    const loader = vi.fn(async () => ({ default: Fake }));
    const Page = lazyWithPreload(loader);
    await Page.preload();
    await Page.preload();
    expect(loader).toHaveBeenCalledTimes(1);

    // Sin act asíncrono: lo que hay tras el primer render es lo que vería el visitante
    render(<Suspense fallback={<p>cargando</p>}><Page /></Suspense>);
    expect(screen.getByText("contenido real")).toBeInTheDocument();
    expect(screen.queryByText("cargando")).not.toBeInTheDocument();
  });

  it("sin descarga previa muestra el respaldo y luego la página", async () => {
    const Page = lazyWithPreload(async () => ({ default: Fake }));
    render(<Suspense fallback={<p>cargando</p>}><Page /></Suspense>);
    expect(screen.getByText("cargando")).toBeInTheDocument();
    expect(await screen.findByText("contenido real")).toBeInTheDocument();
  });

  it("no vuelve a montar la página cuando hay otro render después de la descarga", async () => {
    let mounts = 0;
    const Counted = () => {
      const [id] = useState(() => ++mounts);
      return <p>montaje {id}</p>;
    };
    const Page = lazyWithPreload(async () => ({ default: Counted }));
    const tree = () => <Suspense fallback={<p>cargando</p>}><Page /></Suspense>;
    const view = render(tree());
    expect(await screen.findByText("montaje 1")).toBeInTheDocument();
    // Ya descargada: un render nuevo no debe cambiar de componente (perdería el estado)
    view.rerender(tree());
    view.rerender(tree());
    expect(screen.getByText("montaje 1")).toBeInTheDocument();
    expect(mounts).toBe(1);
  });

  it("vuelve a intentar la descarga después de un fallo", async () => {
    const loader = vi
      .fn<() => Promise<{ default: typeof Fake }>>()
      .mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module"))
      .mockResolvedValueOnce({ default: Fake });
    const Page = lazyWithPreload(loader);
    await expect(Page.preload()).rejects.toThrow();
    await expect(Page.preload()).resolves.toBeUndefined();
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

describe("primer render con la tabla real", () => {
  it("tras preloadRoute, <Routes> pinta la página sin pasar por el respaldo", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {}); // la página 404 avisa en consola
    await preloadRoute("/no-existe");
    render(
      <MemoryRouter initialEntries={["/no-existe"]}>
        <Suspense fallback={<p>cargando</p>}>
          <Routes>{routeElements}</Routes>
        </Suspense>
      </MemoryRouter>,
    );
    // Sin esperar nada: es el primer render
    expect(screen.queryByText("cargando")).not.toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    log.mockRestore();
  });
});
