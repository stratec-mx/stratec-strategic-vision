import { describe, expect, it } from "vitest";
import { datosIniciales } from "@/lib/plano/inmuebles";
import { contenidoPipc, filtrarTipos, fotosDeElementos, hallazgosPorAmbito, inventario, resumenVista, TIPOS_EQUIPOS, TIPOS_SENALIZACION } from "./planoPipc";
import { defSimbolo } from "@/lib/plano/simbolos";
import { tipoPlanoPara } from "@/lib/plano/aDocumento";
import { PIPC_TEMPLATE_ID } from "./plantilla";

const bodega = datosIniciales().inmuebles.find((i) => i.nombre.startsWith("Bodega"))!;

describe("láminas del plano en el Programa Interno", () => {
  it("el anexo común de Documentos trata esta plantilla como Programa Interno (sin lo sensible)", () => {
    expect(tipoPlanoPara(PIPC_TEMPLATE_ID)).toBe("programa_interno");
  });

  it("nunca incluye elementos sensibles", () => {
    const c = contenidoPipc(bodega);
    expect(bodega.elementos.some((e) => defSimbolo(e.tipo).sensible)).toBe(true);
    expect(c.elementos.some((e) => defSimbolo(e.tipo).sensible)).toBe(false);
    expect(c.niveles.flatMap((n) => n.simbolos).some((s) => defSimbolo(s.tipo).sensible)).toBe(false);
  });

  it("filtra por tipo y numera el inventario como en las láminas", () => {
    const conEquipos = {
      ...bodega,
      elementos: [
        { id: "a", tipo: "extintor" as const, lng: -99.19, lat: 18.89, condicion: "malo" as const, ficha: { agente: "PQS (polvo químico seco)", capacidad_kg: 6, fecha_recarga: "2020-01-01" } },
        { id: "b", tipo: "camara" as const, lng: -99.19, lat: 18.89 },
        { id: "c", tipo: "salida_emergencia" as const, lng: -99.19, lat: 18.89 },
      ],
    };
    const c = contenidoPipc(conEquipos);
    expect(filtrarTipos(c, TIPOS_EQUIPOS).exterior.map((e) => e.id)).toEqual(["a"]);
    const inv = inventario(c, TIPOS_EQUIPOS, new Date(2026, 10, 26));
    expect(inv[0]).toMatchObject({ ref: "1", ubicacion: "Exterior", elemento: "Extintor", estado: "Malo", alerta: true });
    expect(inv[0].datos).toMatch(/Recarga vencida/);
    expect(inventario(c, TIPOS_SENALIZACION).map((f) => f.elemento)).toEqual(["Salida de emergencia"]);
  });

  it("separa hallazgos internos y externos y oculta los de elementos sensibles", () => {
    const camara = bodega.elementos.find((e) => e.tipo === "camara")!;
    const inm = {
      ...bodega,
      hallazgos: [
        { id: "h1", titulo: "Cámara sin grabación", fecha: "", elementoId: camara.id, fotos: [], estado: "propuesta" as const },
        { id: "h2", titulo: "Bardas bajas", fecha: "", lng: -99.19, lat: 18.89, fotos: [], estado: "revisado" as const },
        { id: "h3", titulo: "Cables sueltos en bodega", fecha: "", fotos: [], estado: "revisado" as const },
      ],
    };
    const { internos, externos } = hallazgosPorAmbito(contenidoPipc(inm));
    expect(internos.map((h) => h.id)).toEqual(["h3"]);
    expect(externos.map((h) => h.id)).toEqual(["h2"]);
  });

  it("no usa fotos con personas o placas", () => {
    const inm = {
      ...bodega,
      elementos: [
        {
          id: "s", tipo: "salida_emergencia" as const, lng: -99.19, lat: 18.89,
          fotos: [
            { id: "f1", fecha: "", origen: "camara" as const, personas: false },
            { id: "f2", fecha: "", origen: "camara" as const, personas: true },
          ],
        },
      ],
    };
    expect(fotosDeElementos(contenidoPipc(inm), TIPOS_SENALIZACION).map((f) => f.foto.id)).toEqual(["f1"]);
  });

  it("resume en el editor lo que imprimirá cada apartado", () => {
    expect(resumenVista(bodega, "colindancias")).toBe("4 lados del predio");
    expect(resumenVista(bodega, "areas")).toMatch(/1 nivel con croquis · 3 espacios/);
  });
});
