import { describe, expect, it } from "vitest";
import { DIAGNOSTICOS, RUTAS_DIAGNOSTICO, SERVICIOS, TIPOS, camposDe, datosPerfil, perfilCompleto, perfilInicial, tipoDesdeParam } from "./diagnosticoPreguntas";
import { SERVICE_CATALOG } from "@/lib/quoteCatalog";
import { encodeLeadProfile, parseLeadProfile } from "@/lib/pricing";

describe("diagnóstico: tres cuestionarios", () => {
  it("cada tipo tiene 10 preguntas numeradas, con riesgo y un servicio que existe", () => {
    for (const tipo of TIPOS) {
      const { preguntas } = DIAGNOSTICOS[tipo];
      expect(preguntas.map((q) => q.id), tipo).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      for (const q of preguntas) {
        expect(q.text.startsWith("¿") && q.text.includes("?"), `${tipo} ${q.id}`).toBe(true);
        expect(q.short.length, `${tipo} ${q.id}`).toBeGreaterThan(5);
        expect(q.short.length, `${tipo} ${q.id}`).toBeLessThanOrEqual(52);
        expect(q.riesgo.length, `${tipo} ${q.id}`).toBeGreaterThan(40);
        expect(q.services.length, `${tipo} ${q.id}`).toBeGreaterThan(0);
        for (const s of q.services) expect(SERVICIOS[s], `${tipo} ${q.id} ${s}`).toBeDefined();
      }
    }
  });

  it("los servicios sugeridos son servicios publicados del sitio, con su código del cotizador", () => {
    for (const [clave, s] of Object.entries(SERVICIOS)) {
      const enCatalogo = SERVICE_CATALOG.find((c) => c.code === s.code);
      expect(enCatalogo, clave).toBeDefined();
      expect(s.url.startsWith("/servicios/"), clave).toBe(true);
    }
  });

  it("los textos públicos no prometen lo que STRATEC no ofrece", () => {
    const todo = JSON.stringify(DIAGNOSTICOS).toLowerCase();
    for (const prohibido of ["certifica", "dictamen eléctrico", "dictamen estructural", "programa especial", "ley general", "registrada ante"]) {
      expect(todo.includes(prohibido), prohibido).toBe(false);
    }
  });

  it("lee el tipo desde la dirección, con variantes y signos pegados", () => {
    expect(tipoDesdeParam(null)).toBe("negocio");
    expect(tipoDesdeParam("")).toBe("negocio");
    expect(tipoDesdeParam("otra-cosa")).toBe("negocio");
    expect(tipoDesdeParam("casa")).toBe("casa");
    expect(tipoDesdeParam("Casa)")).toBe("casa");
    expect(tipoDesdeParam("hogar")).toBe("casa");
    expect(tipoDesdeParam("evento.")).toBe("evento");
    expect(tipoDesdeParam("eventos")).toBe("evento");
  });

  it("el último paso exige solo los campos obligatorios", () => {
    expect(perfilInicial("negocio")).toEqual({ giro: "", personas: "", superficie: "ns", estado: "" });
    expect(perfilCompleto("negocio", perfilInicial("negocio"))).toBe(false);
    expect(perfilCompleto("negocio", { giro: "comercio", personas: "1-15", superficie: "ns", estado: "Morelos" })).toBe(true);
    expect(perfilCompleto("casa", { vivienda: "sola", habitantes: "3-5", estado: "Morelos" })).toBe(true);
    expect(perfilCompleto("casa", { vivienda: "castillo", habitantes: "3-5", estado: "Morelos" })).toBe(false);
    expect(perfilCompleto("evento", { evento: "feria", asistentes: "500-1000", lugar: "abierto", estado: "Puebla", cuando: "ns" })).toBe(true);
    expect(perfilCompleto("evento", { evento: "feria", asistentes: "500-1000", lugar: "", estado: "Puebla", cuando: "ns" })).toBe(false);
    // La segmentación del evento se puede validar por separado, antes de las preguntas
    expect(perfilCompleto("evento", { evento: "feria", asistentes: "500-1000" }, "antes")).toBe(true);
    expect(perfilCompleto("evento", { evento: "feria" }, "antes")).toBe(false);
  });

  it("arma los datos legibles y omite los opcionales sin responder", () => {
    expect(datosPerfil("casa", { vivienda: "privada", habitantes: "3-5", estado: "Morelos" })).toEqual([
      ["Vivienda", "Casa en fraccionamiento o privada"], ["Habitantes", "3 a 5 personas"], ["Estado", "Morelos"],
    ]);
    expect(datosPerfil("evento", { evento: "concierto", asistentes: "1001-5000", lugar: "abierto", estado: "Morelos", cuando: "ns" })).toEqual([
      ["Evento", "Concierto o espectáculo"], ["Asistentes", "De 1,001 a 5,000 personas"], ["Lugar", "Al aire libre"], ["Estado", "Morelos"],
    ]);
    expect(datosPerfil("evento", { evento: "concierto", asistentes: "1001-5000", lugar: "abierto", estado: "Morelos", cuando: "1m" }).at(-1)).toEqual(["Fecha", "En menos de 1 mes"]);
    expect(datosPerfil("negocio", { giro: "comercio", personas: "1-15", superficie: "ns", estado: "Morelos" }).map(([k]) => k)).toEqual(["Giro", "Personas", "Estado"]);
  });
});

describe("una página por diagnóstico", () => {
  it("cada tipo tiene su dirección y las direcciones de campaña apuntan al correcto", () => {
    expect(TIPOS.map((t) => DIAGNOSTICOS[t].ruta)).toEqual(["/diagnostico", "/diagnostico-residencial", "/diagnostico-eventos"]);
    for (const t of TIPOS) expect(RUTAS_DIAGNOSTICO[DIAGNOSTICOS[t].ruta]).toBe(t);
    expect(RUTAS_DIAGNOSTICO["/diagnostico-empresarial"]).toBe("negocio");
  });

  it("eventos pregunta tipo y asistencia antes de las 10 preguntas; casa y negocio no", () => {
    expect(camposDe("evento", "antes").map((c) => c.id)).toEqual(["evento", "asistentes"]);
    expect(camposDe("evento", "final").map((c) => c.id)).toEqual(["lugar", "estado", "cuando"]);
    expect(camposDe("casa", "antes")).toEqual([]);
    expect(camposDe("negocio", "antes")).toEqual([]);
    expect(camposDe("evento", "antes")[0].options.map((o) => o.label)).toEqual([
      "Concierto o espectáculo", "Evento deportivo", "Feria, festival o exposición", "Evento cultural o religioso",
      "Evento empresarial o corporativo", "Evento político o institucional", "Otro",
    ]);
    expect(camposDe("evento", "antes")[1].options.map((o) => o.label)).toEqual([
      "Menos de 500 personas", "De 500 a 1,000 personas", "De 1,001 a 5,000 personas", "De 5,001 a 10,000 personas", "Más de 10,000 personas",
    ]);
  });

  it("casa y eventos se presentan como diagnóstico inicial y dicen su alcance", () => {
    expect(DIAGNOSTICOS.casa.landing.titulo).toBe("Diagnóstico inicial de seguridad residencial");
    expect(DIAGNOSTICOS.evento.landing.titulo).toBe("Diagnóstico inicial de seguridad para eventos masivos");
    expect(DIAGNOSTICOS.casa.landing.alcance).toContain("no sustituye una inspección física");
    expect(DIAGNOSTICOS.evento.landing.alcance).toContain("no garantiza que el evento sea seguro");
    expect(DIAGNOSTICOS.evento.pdf.alcance).toContain("autorizaciones necesarias");
  });
});

describe("perfil del lead para el cotizador", () => {
  it("el de negocio sigue igual que antes cuando no se indica tipo", () => {
    const linea = encodeLeadProfile({ giro: "comercio", people: 40, area: 300, morelos: true }, ["STR-01", "STR-02.1"]);
    expect(linea).toBe("[perfil] giro=comercio; personas=40; m2=300; morelos=si; servicios=STR-01,STR-02.1");
    expect(parseLeadProfile(linea)).toEqual({ profile: { giro: "comercio", people: 40, area: 300, morelos: true }, codes: ["STR-01", "STR-02.1"] });
  });

  it("casa y evento viajan sin giro y con su tipo", () => {
    const linea = encodeLeadProfile({ morelos: false }, ["STR-01", "STR-04"], "casa");
    expect(linea).toBe("[perfil] tipo=casa; morelos=no; servicios=STR-01,STR-04");
    expect(parseLeadProfile(`nota\n${linea}`)).toEqual({ profile: { morelos: false }, codes: ["STR-01", "STR-04"], tipo: "casa" });
    expect(parseLeadProfile(encodeLeadProfile({ morelos: true }, ["STR-02"], "evento"))?.tipo).toBe("evento");
  });

  it("un tipo desconocido se ignora sin romper la lectura", () => {
    expect(parseLeadProfile("[perfil] tipo=castillo; giro=salud; servicios=STR-03")).toEqual({ profile: { giro: "salud" }, codes: ["STR-03"] });
  });
});
