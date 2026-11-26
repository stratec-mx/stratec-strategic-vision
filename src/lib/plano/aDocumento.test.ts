import { describe, expect, it } from "vitest";
import { descripcionDesdePlano, fusionarHallazgos, hallazgosDesdePlano, tipoPlanoPara } from "./aDocumento";
import { ejemploTemixco } from "./ejemplos";

describe("del plano al documento", () => {
  const inm = ejemploTemixco();
  it("describe superficie, colindancias y lo registrado", () => {
    const t = descripcionDesdePlano(inm, "diagnostico-seguridad");
    expect(t).toMatch(/superficie aproximada de/);
    expect(t).toMatch(/Colindancias:/);
    expect(t).toMatch(/extintor/);
  });
  it("trae los hallazgos sin duplicarlos al repetir", () => {
    const h = hallazgosDesdePlano(inm, "diagnostico-seguridad");
    expect(h).toHaveLength(2);
    const manual = { id: "a1", area: "Patio", description: "Escrito a mano", severity: "baja" as const };
    const una = fusionarHallazgos([manual], h);
    const dos = fusionarHallazgos(una, h);
    expect(dos).toHaveLength(3);
    expect(dos[0]).toEqual(manual);
  });
  it("el Programa Interno usa el plano sin lo sensible", () => {
    expect(tipoPlanoPara("revision-programa-interno")).toBe("programa_interno");
    expect(tipoPlanoPara("diagnostico-seguridad")).toBe("diagnostico");
  });
});

import { plural } from "./aDocumento";
describe("plurales", () => {
  it("pluraliza las etiquetas del catálogo", () => {
    expect(plural("extintor", 3)).toBe("extintores");
    expect(plural("salida de emergencia", 2)).toBe("salidas de emergencia");
    expect(plural("botiquín", 2)).toBe("botiquines");
    expect(plural("punto de reunión", 1)).toBe("punto de reunión");
    expect(plural("luminaria", 2)).toBe("luminarias");
  });
});
