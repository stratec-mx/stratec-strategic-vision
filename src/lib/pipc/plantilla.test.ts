import { describe, expect, it } from "vitest";
import { DOCUMENT_TEMPLATES, emptyDocumentData, findTemplate, normalizeDocumentData } from "@/lib/documentTemplates";
import {
  apartadosPipc, autoridad, bibliografia, guiaAnexos, normalizePipc, PIPC_MORELOS, PIPC_TEMPLATE_ID, pipcInicial, profundidad,
  sugerenciasNoAplica, textoClasificacion, visibleEnVariante,
} from "./plantilla";
import { parseTabla } from "./pipcPdf";

const ap = apartadosPipc(PIPC_MORELOS.blocks);
const codigos = ap.map((b) => b.code);

describe("plantilla del Programa Interno de Morelos", () => {
  it("aparece entre las plantillas de Nuevo documento", () => {
    expect(DOCUMENT_TEMPLATES.some((t) => t.id === PIPC_TEMPLATE_ID)).toBe(true);
    expect(findTemplate(PIPC_TEMPLATE_ID)?.serviceCode).toBe("STR-02.1");
  });

  it("tiene los capítulos I a IX en el orden de la guía", () => {
    expect(ap.filter((b) => profundidad(b.code) === 0).map((b) => b.code)).toEqual(["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"]);
  });

  it("incluye los apartados de la guía, sin códigos repetidos", () => {
    for (const c of ["I.2.15", "I.10", "II.1.4", "II.3.6", "II.5.4", "II.7.1.2", "II.8.2", "II.12.10", "II.13", "II.14.4", "II.16", "III.1.6", "IV.2.2", "V.5", "VI.11"]) {
      expect(codigos).toContain(c);
    }
    expect(new Set(codigos).size).toBe(codigos.length);
    expect(new Set(ap.map((b) => b.key)).size).toBe(ap.length);
  });

  it("los apartados con lámina toman su vista del plano", () => {
    const vistas = Object.fromEntries(ap.filter((b) => b.type === "plano").map((b) => [b.code, b.type === "plano" ? b.vista : ""]));
    expect(vistas).toEqual({
      "I.8": "georreferencia",
      "I.9": "colindancias",
      "I.10": "areas",
      "II.7.1.1": "riesgos_internos",
      "II.7.2.1": "riesgos_externos",
      "II.8.1": "equipos_inventario",
      "II.8.2": "equipos_localizacion",
      "II.9": "senalizacion",
      "II.9.1": "senalizacion_localizacion",
    });
  });

  it("reutiliza la matriz de riesgos, el mapa de calor y las acciones de M-DESR", () => {
    const tipos = PIPC_MORELOS.blocks.filter((b) => b.type !== "apartado" && b.type !== "plano").map((b) => `${b.type}:${"code" in b ? b.code : ""}`);
    expect(tipos).toEqual(["risks:V.2", "heatmap:V.2", "actions:VIII"]);
  });

  it("los apartados institucionales solo se ven en esa variante", () => {
    const inst = ap.filter((b) => b.soloInstitucional).map((b) => b.code);
    expect(inst).toEqual(["III.1.6.1", "III.1.6.2", "III.1.6.3"]);
    const p = pipcInicial();
    expect(visibleEnVariante(ap.find((b) => b.code === "III.1.6.1")!, p)).toBe(false);
    expect(visibleEnVariante(ap.find((b) => b.code === "III.1.6.1")!, { ...p, variante: "institucional" })).toBe(true);
  });

  it("un documento nuevo trae los datos del PIPC y los esqueletos de tabla", () => {
    const d = emptyDocumentData(PIPC_MORELOS);
    expect(d.pipc?.variante).toBe("cepcm");
    expect(d.sections.pipc_I_2_10).toContain("|");
    const n = normalizeDocumentData(PIPC_MORELOS, { ...d, pipc: { noAplica: { "I.3": "x" } } });
    expect(n.pipc?.noAplica).toEqual({ "I.3": "x" });
    expect(n.pipc?.condiciones).toEqual({});
    // Las demás plantillas no cambian.
    expect(emptyDocumentData(findTemplate("diagnostico-seguridad")!).pipc).toBeUndefined();
  });
});

describe("No aplica y contenido generado", () => {
  it("sugiere No aplica solo con respuestas explícitas y respeta lo ya marcado", () => {
    const p = normalizePipc({ condiciones: { nuevoIngreso: "si", gasLP: "no", sqp: undefined }, noAplica: { "I.4": "Ya marcado" } });
    const s = sugerenciasNoAplica(p, PIPC_MORELOS.blocks);
    expect(s["II.12.3"]).toMatch(/gas L\.P\./);
    expect(s["I.5"]).toBe("Establecimiento de nuevo ingreso.");
    expect(s["I.4"]).toBeUndefined();
    expect(s["II.6"]).toBeUndefined();
  });

  it("la guía de anexos lleva los apartados con anexo que sí aplican", () => {
    const p = normalizePipc({ noAplica: { "I.3": "Firma el representante" } });
    const g = guiaAnexos(PIPC_MORELOS.blocks, p).map((b) => b.code);
    expect(g).toContain("I.2.13");
    expect(g).toContain("II.12.1");
    expect(g).not.toContain("I.3");
    expect(g).not.toContain("I.1");
  });

  it("la bibliografía lista la base legal y las normas citadas sin repetir", () => {
    const todas = bibliografia(PIPC_MORELOS.blocks, pipcInicial());
    expect(todas[0]).toMatch(/Ley Estatal/);
    expect(todas.filter((n) => n === "NOM-002-STPS-2010")).toHaveLength(1);
    // Solo números de norma: las notas internas no salen en el documento.
    expect(todas.every((n) => !/verificar|confirmar/i.test(n))).toBe(true);
    const sinGas = bibliografia(PIPC_MORELOS.blocks, normalizePipc({ noAplica: { "II.12.3": "Sin gas" } }));
    expect(sinGas).not.toContain("NOM-004-SEDG-2004");
  });

  it("la clasificación define ante quién se presenta", () => {
    expect(autoridad(normalizePipc({ clasificacion: "alto" }))).toMatch(/Coordinación Estatal/);
    expect(autoridad(normalizePipc({ clasificacion: "ordinario", municipio: "Jiutepec" }))).toMatch(/Jiutepec/);
    expect(textoClasificacion(normalizePipc({ clasificacion: "ordinario" }))).toMatch(/riesgo ordinario/);
    expect(textoClasificacion(pipcInicial())).toBe("");
  });

  it("convierte los renglones con «|» en tabla", () => {
    expect(parseTabla("Turno | Horario\n| Matutino | 8 a 15 |")).toEqual([["Turno", "Horario"], ["Matutino", "8 a 15"]]);
    expect(parseTabla("Texto normal\nsin columnas")).toBeNull();
  });
});
