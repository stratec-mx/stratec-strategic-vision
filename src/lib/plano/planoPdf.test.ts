import { describe, expect, it } from "vitest";
import { contenidoDocumento, resumenFicha } from "./planoPdf";
import { datosIniciales } from "./inmuebles";

describe("documento del plano", () => {
  const bodega = datosIniciales().inmuebles.find((i) => i.nombre.startsWith("Bodega"))!;
  it("el Programa Interno omite lo sensible y el diagnóstico lo incluye", () => {
    const pipc = contenidoDocumento(bodega, "programa_interno");
    const diag = contenidoDocumento(bodega, "diagnostico");
    expect(pipc.elementos.some((e) => e.tipo === "camara")).toBe(false);
    expect(diag.elementos.some((e) => e.tipo === "camara")).toBe(true);
  });
  it("oculta en el Programa Interno los hallazgos de elementos sensibles", () => {
    const camara = bodega.elementos.find((e) => e.tipo === "camara")!;
    const conHallazgo = { ...bodega, hallazgos: [{ id: "h1", titulo: "Cámara sin grabación", fecha: "", elementoId: camara.id, fotos: [], estado: "propuesta" as const }] };
    expect(contenidoDocumento(conHallazgo, "programa_interno").hallazgos).toHaveLength(0);
    expect(contenidoDocumento(conHallazgo, "diagnostico").hallazgos).toHaveLength(1);
  });
  it("resume la ficha en una línea", () => {
    expect(resumenFicha("extintor", { ficha: { agente: "CO₂", capacidad_kg: 6, fecha_recarga: "2026-03-15" } })).toBe("Agente: CO₂ · Capacidad: 6 kg · Última recarga: 15/03/2026");
    expect(resumenFicha("camara", { ficha: { lpr: true } })).toBe("Lector de matrículas (LPR): sí");
  });
});
