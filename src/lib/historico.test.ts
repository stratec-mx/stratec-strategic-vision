import { describe, it, expect } from "vitest";
import { agruparHistorico } from "./historico";

const HOY = new Date("2026-11-11T18:00:00Z");
const leads = [{ created_at: "2026-09-03T15:00:00Z" }, { created_at: "2026-11-11T03:00:00Z" }]; // el 2º es 10-nov en Cuernavaca
const cotizaciones = [
  { created_at: "2026-09-20T17:00:00Z", total: 20880, currency: "MXN", status: "accepted" },
  { created_at: "2026-11-10T20:00:00Z", total: 11600, currency: "MXN", status: "sent" },
  { created_at: "2026-11-10T21:00:00Z", total: 1000, currency: "USD", status: "sent" },
];

describe("Histórico por día, mes y año", () => {
  it("por mes: orden cronológico y meses sin actividad en cero", () => {
    const d = agruparHistorico(leads, cotizaciones, "mes", HOY);
    expect(d.map((p) => p.clave)).toEqual(["2026-09", "2026-10", "2026-11"]);
    expect(d[1]).toMatchObject({ leads: 0, cotizaciones: 0, monto: 0 });
    expect(d[0]).toMatchObject({ leads: 1, cotizaciones: 1, monto: 20880, aceptadas: 1, montoAceptado: 20880 });
    expect(d[2]).toMatchObject({ leads: 1, cotizaciones: 2, monto: 11600 }); // USD no se suma al monto en pesos
  });

  it("por día: últimos 31 días en hora de Cuernavaca", () => {
    const d = agruparHistorico(leads, cotizaciones, "dia", HOY);
    expect(d).toHaveLength(31);
    expect(d[d.length - 1].clave).toBe("2026-11-11");
    expect(d.find((p) => p.clave === "2026-11-10")).toMatchObject({ leads: 1, cotizaciones: 2 });
  });

  it("por año", () => {
    const d = agruparHistorico(leads, cotizaciones, "anio", HOY);
    expect(d).toEqual([expect.objectContaining({ clave: "2026", leads: 2, cotizaciones: 3, monto: 32480 })]);
  });

  it("sin datos: solo el periodo actual", () => {
    expect(agruparHistorico([], [], "mes", HOY).map((p) => p.clave)).toEqual(["2026-11"]);
  });
});
