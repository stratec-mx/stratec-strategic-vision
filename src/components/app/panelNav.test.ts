import { describe, expect, it } from "vitest";
import { MODULOS, esProduccion, migas } from "./panelNav";

describe("menú del panel", () => {
  it("tiene los módulos del diseño en su orden", () => {
    expect(MODULOS.map((m) => m.label)).toEqual([
      "Panel general", "Clientes", "Prospectos", "Proyectos", "Inmuebles y sedes", "Inspecciones y diagnósticos",
      "Análisis de riesgos", "Planes de tratamiento", "Cotizaciones", "Documentos", "Agenda", "Analítica", "Configuración",
    ]);
  });
  it("los módulos M-DESR explican qué harán", () => {
    expect(MODULOS.filter((m) => m.enPreparacion).map((m) => m.to)).toEqual(
      ["/app/proyectos", "/app/inspecciones", "/app/riesgos", "/app/tratamiento"],
    );
  });
  it("arma la ruta de navegación", () => {
    expect(migas("/app")).toEqual([{ label: "Inicio", to: "/app" }, { label: "Panel general" }]);
    expect(migas("/app/leads").map((m) => m.label)).toEqual(["Inicio", "Prospectos"]);
    expect(migas("/app/documents/abc").map((m) => m.label)).toEqual(["Inicio", "Documentos", "Detalle"]);
  });
  it("distingue producción del proyecto de prueba", () => {
    expect(esProduccion("https://xtfsqdwkbsghkzszpisz.supabase.co")).toBe(true);
    expect(esProduccion("https://otroproyecto.supabase.co")).toBe(false);
    expect(esProduccion("https://xtfsqdwkbsghkzszpisz.evil.example.com")).toBe(false);
    expect(esProduccion(undefined)).toBe(false);
  });
});
