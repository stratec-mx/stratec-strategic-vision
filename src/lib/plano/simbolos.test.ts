import { describe, expect, it } from "vitest";
import { avisosElemento, SIMBOLOS, tipoSimbolo } from "./simbolos";
import { datosIniciales, normalizarDatos, type Datos } from "./inmuebles";

describe("símbolos y fichas", () => {
  it("separa lo sensible de lo de emergencia (D-P5)", () => {
    expect(SIMBOLOS.alarma_emergencia.sensible).toBeFalsy();
    expect(SIMBOLOS.salida_emergencia.sensible).toBeFalsy();
    expect(SIMBOLOS.sensor_intrusion.sensible).toBe(true);
    expect(SIMBOLOS.control_acceso.sensible).toBe(true);
    expect(SIMBOLOS.camara.sensible).toBe(true);
  });

  it("lee los códigos anteriores del prototipo", () => {
    expect(tipoSimbolo("salida")).toBe("salida_emergencia");
    expect(tipoSimbolo("alarma")).toBe("alarma_emergencia");
    expect(tipoSimbolo("extintor")).toBe("extintor");
    expect(tipoSimbolo("desconocido")).toBeNull();
  });

  it("avisa la recarga vencida del extintor y el mal estado", () => {
    const hoy = new Date(2026, 10, 25);
    expect(avisosElemento("extintor", { ficha: { fecha_recarga: "2025-10-01" } }, hoy)).toEqual(["Recarga vencida"]);
    expect(avisosElemento("extintor", { ficha: { fecha_recarga: "2026-03-01" } }, hoy)).toEqual([]);
    expect(avisosElemento("botiquin", { condicion: "no_funciona" }, hoy)).toEqual(["Estado: no funciona"]);
    expect(avisosElemento("salida_emergencia", { ficha: { libre: false } }, hoy)).toEqual(["Salida obstruida"]);
  });

  it("pone al día lo guardado en el navegador con códigos viejos", () => {
    const d = datosIniciales();
    const viejo = {
      ...d,
      inmuebles: [{ ...d.inmuebles[0], elementos: [{ id: "a", tipo: "salida", lng: 0, lat: 0 }, { id: "b", tipo: "otro", lng: 0, lat: 0 }] }],
    } as unknown as Datos;
    const n = normalizarDatos(viejo);
    expect(n.inmuebles[0].elementos.map((e) => e.tipo)).toEqual(["salida_emergencia"]);
  });
});
