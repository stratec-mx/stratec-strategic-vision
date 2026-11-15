import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// jsdom no trae ResizeObserver y las gráficas (recharts) lo usan
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } } }));

import { GooglePublico } from "./GooglePublico";

const conDatos = {
  dias: 28, generado: "2026-11-14T18:00:00Z", cuenta: "panel@proyecto.iam.gserviceaccount.com",
  gsc: {
    ok: true, rango: { inicio: "2026-10-15", fin: "2026-11-11" },
    totales: { actual: { clics: 30, impresiones: 1200, ctr: 2.5, posicion: 12 }, anterior: { clics: 20, impresiones: 900, ctr: 2.2, posicion: 14 } },
    diario: [{ fecha: "2026-11-10", clics: 1, impresiones: 40 }, { fecha: "2026-11-11", clics: 2, impresiones: 55 }],
    consultas: [{ clave: "stratec security", clics: 10, impresiones: 30, ctr: 33.3, posicion: 1.1 }],
    oportunidades: [{ clave: "programa interno proteccion civil", clics: 0, impresiones: 120, ctr: 0, posicion: 9 }],
    paginas: [{ clave: "https://www.stratecsecurity.com/", clics: 12, impresiones: 300, ctr: 4, posicion: 6 }],
    dispositivos: [],
  },
  ga4: {
    ok: true, rango: { inicio: "2026-10-17", fin: "2026-11-13" },
    totales: { actual: { usuarios: 100, nuevos: 80, sesiones: 140, interaccion: 55, duracion: 70 }, anterior: { usuarios: 90, nuevos: 70, sesiones: 120, interaccion: 50, duracion: 60 } },
    canales: [{ nombre: "Organic Search", sesiones: 70, usuarios: 50 }],
    ciudades: [{ nombre: "Cuernavaca", usuarios: 25 }],
    entradas: [{ pagina: "/diagnostico", sesiones: 20, interaccion: 70 }],
    acciones: [{ evento: "click_whatsapp", total: 12 }],
    dispositivos: [{ nombre: "mobile", usuarios: 75 }],
    diario: [], fuentes: [],
  },
};

describe("GooglePublico", () => {
  beforeEach(() => invoke.mockReset());

  it("muestra búsquedas, oportunidades y visitantes", async () => {
    invoke.mockResolvedValue({ data: conDatos, error: null });
    render(<GooglePublico />);
    expect(await screen.findByText("En pocas palabras")).toBeInTheDocument();
    expect(screen.getAllByText("stratec security").length).toBeGreaterThan(0);
    expect(screen.getByText("programa interno proteccion civil")).toBeInTheDocument();
    expect(screen.getByText("Búsqueda en Google (orgánica)")).toBeInTheDocument();
    expect(screen.getByText("Clic en WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Teléfono")).toBeInTheDocument();
    expect(screen.getAllByText("Inicio").length).toBeGreaterThan(0);
    expect(invoke).toHaveBeenCalledWith("google-insights", { body: { dias: 28, refrescar: false } });
  });

  it("explica cómo conectar cuando faltan las credenciales", async () => {
    invoke.mockResolvedValue({ data: { ...conDatos, gsc: { ok: false, motivo: "sin_configurar" }, ga4: { ok: false, motivo: "sin_configurar" } }, error: null });
    render(<GooglePublico />);
    expect(await screen.findByText("Conecta Search Console y Google Analytics")).toBeInTheDocument();
    expect(screen.getByText("panel@proyecto.iam.gserviceaccount.com")).toBeInTheDocument();
  });

  it("si una fuente no tiene acceso, lo dice y muestra la otra", async () => {
    invoke.mockResolvedValue({ data: { ...conDatos, gsc: { ok: false, motivo: "sin_acceso" } }, error: null });
    render(<GooglePublico />);
    expect(await screen.findByText(/no tiene acceso/)).toBeInTheDocument();
    expect(screen.getByText("Visitantes del sitio")).toBeInTheDocument();
  });

  it("si la función aún no está publicada, muestra los pasos para conectar", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 404 } } });
    render(<GooglePublico />);
    expect(await screen.findByText("Conecta Search Console y Google Analytics")).toBeInTheDocument();
  });
});
