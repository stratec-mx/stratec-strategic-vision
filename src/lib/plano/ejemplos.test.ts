import { describe, expect, it } from "vitest";
import { ejemploTemixco } from "./ejemplos";
import { SIMBOLOS } from "./simbolos";

describe("ejemplo del ayuntamiento de Temixco", () => {
  const e = ejemploTemixco();
  it("usa el contorno real de OpenStreetMap y un croquis con dos espacios", () => {
    expect(e.perimetro).toHaveLength(5);
    expect(e.croquis.niveles[0].espacios.map((x) => x.nombre).sort()).toEqual(["Atención ciudadana (ejemplo)", "Oficinas (ejemplo)"]);
  });
  it("la puerta principal queda en el muro sur", () => {
    const n = e.croquis.niveles[0];
    expect(n.aberturas.length).toBeGreaterThanOrEqual(1);
  });
  it("no trae elementos sensibles (regla 5: nada sensible en demostraciones de un edificio real)", () => {
    const tipos = [...e.elementos.map((x) => x.tipo), ...e.croquis.niveles.flatMap((n) => n.simbolos.map((s) => s.tipo))];
    expect(tipos.filter((t) => SIMBOLOS[t]?.sensible)).toEqual([]);
  });
});
