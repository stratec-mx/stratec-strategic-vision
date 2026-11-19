import { describe, expect, it } from "vitest";
import {
  agendaHoyManana, calcularAvisos, haceCuanto, interesLead, origenLead, resumenCitas,
  resumenCotizaciones, resumenCsv, resumenProspectos, sinRespuesta,
} from "./panelGeneral";
import { aResultado, filtroOr, limpiarBusqueda, objetivosPermitidos, OBJETIVOS } from "./panelSearch";

// Jueves 19 nov 2026, 10:00 en Ciudad de México (UTC-6)
const NOW = new Date("2026-11-19T16:00:00Z");
const dias = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe("resumenProspectos", () => {
  it("cuenta los de 30 días y cuántos siguen en estado nuevo", () => {
    const r = resumenProspectos([
      { status: "new", created_at: dias(1) },
      { status: "contacted", created_at: dias(3) },
      { status: "new", created_at: dias(29) },
      { status: "new", created_at: dias(31) },
    ], NOW);
    expect(r).toEqual({ nuevos: 3, sinContacto: 2 });
  });
  it("sin prospectos da ceros", () => expect(resumenProspectos([], NOW)).toEqual({ nuevos: 0, sinContacto: 0 }));
});

describe("origen e interés del prospecto", () => {
  it("reconoce WhatsApp, chat y diagnóstico por sus notas", () => {
    expect(origenLead({ source: "other", notes: "[whatsapp] 19 nov · Pidió cotización" })).toBe("WhatsApp");
    expect(origenLead({ source: "whatsapp", notes: null })).toBe("WhatsApp");
    expect(origenLead({ source: "web", notes: "Chat del sitio · pidió que lo contacten" })).toBe("Chat del sitio");
    expect(origenLead({ source: "web", notes: "[perfil] giro=oficina; servicios=STR-02" })).toBe("Diagnóstico en línea");
    expect(origenLead({ source: "referral", notes: "" })).toBe("Referido");
  });
  it("toma el servicio del formulario, luego el del diagnóstico y luego la necesidad", () => {
    expect(interesLead({ notes: "Servicio: Videovigilancia\n\nHola" })).toBe("Videovigilancia");
    expect(interesLead({ notes: "Chat del sitio\nNecesidad: Capacitación de brigadas" })).toBe("Capacitación de brigadas");
    expect(interesLead({ notes: null })).toBe("Sin especificar");
    const conPerfil = interesLead({ notes: "[perfil] servicios=STR-02, STR-03" });
    expect(conPerfil).toMatch(/ y 1 más$/);
  });
});

describe("haceCuanto", () => {
  it("usa minutos, horas, ayer o fecha", () => {
    expect(haceCuanto(new Date(NOW.getTime() - 20 * 60_000).toISOString(), NOW)).toBe("Hace 20 min");
    expect(haceCuanto(new Date(NOW.getTime() - 3 * 3_600_000).toISOString(), NOW)).toBe("Hace 3 h");
    expect(haceCuanto("2026-11-18T20:00:00Z", NOW)).toBe("Ayer");
    expect(haceCuanto("2026-11-02T18:00:00Z", NOW)).toMatch(/^02 nov/);
  });
});

describe("cotizaciones", () => {
  const q = (id: string, status: string, creada: string, cambio: string) => ({ id, number: `COT-${id}`, status, created_at: creada, updated_at: cambio });
  const filas = [
    q("1", "sent", dias(2), dias(2)),
    q("2", "sent", dias(10), dias(7)),
    q("3", "draft", dias(1), dias(1)),
    q("4", "accepted", dias(4), dias(1)),
    q("5", "sent", "2026-10-20T18:00:00Z", "2026-10-21T18:00:00Z"), // del mes pasado
  ];
  it("separa las por responder y las que llevan más de 5 días", () => {
    const r = resumenCotizaciones(filas, NOW);
    expect(r.porResponder).toBe(3);
    expect(r.sinRespuesta).toBe(2);
  });
  it("cuenta solo las creadas este mes, por estado", () => {
    const r = resumenCotizaciones(filas, NOW);
    expect(r.mesTotal).toBe(4);
    expect(r.porEstado).toEqual({ draft: 1, sent: 2, accepted: 1, rejected: 0, expired: 0 });
  });
  it("una aceptada vieja no cuenta como sin respuesta", () => {
    expect(sinRespuesta({ status: "accepted", updated_at: dias(30) }, NOW)).toBe(false);
    expect(sinRespuesta({ status: "sent", updated_at: dias(5.1) }, NOW)).toBe(true);
  });
});

describe("agenda", () => {
  const citas = [
    { id: "a", title: "Inspección", starts_at: "2026-11-19T15:30:00Z" }, // hoy 09:30
    { id: "b", title: "Llamada", starts_at: "2026-11-19T22:00:00Z" }, // hoy 16:00
    { id: "c", title: "Entrega", starts_at: "2026-11-20T16:00:00Z" }, // mañana 10:00
    { id: "d", title: "Otra", starts_at: "2026-11-22T16:00:00Z" },
    { id: "e", title: "Ayer", starts_at: "2026-11-18T16:00:00Z" },
  ];
  it("lista hoy y mañana con hora de Ciudad de México", () => {
    const a = agendaHoyManana(citas, NOW);
    expect(a.map((x) => [x.id, x.dia, x.hora])).toEqual([["a", "hoy", "09:30"], ["b", "hoy", "16:00"], ["c", "manana", "10:00"]]);
  });
  it("una cita a las 23:30 de hoy en México sigue siendo de hoy", () => {
    expect(agendaHoyManana([{ id: "n", title: "Noche", starts_at: "2026-11-20T05:30:00Z" }], NOW)[0].dia).toBe("hoy");
  });
  it("indicador: citas de hoy y la próxima", () => {
    expect(resumenCitas(citas, NOW)).toEqual({ hoy: 2, nota: "Próxima: hoy 16:00" });
    expect(resumenCitas([], NOW).nota).toBe("Sin citas próximas");
  });
});

describe("avisos", () => {
  it("junta citas de hoy, cotizaciones sin respuesta y prospectos sin contactar", () => {
    const a = calcularAvisos({
      leadsNuevos: [{ id: "l1", full_name: "Ana", organization: "Hotel", created_at: dias(1) }],
      cotizaciones: [
        { id: "q1", number: "COT-1", status: "sent", updated_at: dias(8) },
        { id: "q2", number: "COT-2", status: "sent", updated_at: dias(1) },
      ],
      citas: [{ id: "c1", title: "Visita", starts_at: "2026-11-19T20:00:00Z" }, { id: "c2", title: "Mañana", starts_at: "2026-11-20T20:00:00Z" }],
    }, NOW);
    expect(a.map((x) => x.id)).toEqual(["cita:c1", "cot:q1", "lead:l1"]);
    expect(a[0].titulo).toBe("Cita hoy a las 14:00");
    expect(a[2].detalle).toBe("Ana · Hotel");
  });
  it("sin datos no hay avisos", () => expect(calcularAvisos({}, NOW)).toEqual([]));
});

describe("resumenCsv", () => {
  it("escapa comas, comillas y fórmulas", () => {
    const csv = resumenCsv([
      { seccion: "Indicadores", concepto: "Prospectos", valor: 3, detalle: "1 sin contacto" },
      { seccion: "Prospectos", concepto: 'Hotel "Sol", SA', valor: "=HYPERLINK()" },
    ]);
    const lineas = csv.replace("﻿", "").split("\r\n");
    expect(lineas[0]).toBe("Sección,Concepto,Valor,Detalle");
    expect(lineas[1]).toBe("Indicadores,Prospectos,3,1 sin contacto");
    expect(lineas[2]).toBe(`Prospectos,"Hotel ""Sol"", SA",'=HYPERLINK(),`);
  });
});

describe("buscador", () => {
  it("limpia lo que rompería el filtro", () => {
    expect(limpiarBusqueda("  Hotel, (Sol)%  ")).toBe("Hotel Sol");
    expect(limpiarBusqueda("a")).toBe("");
    expect(limpiarBusqueda("*,")).toBe("");
  });
  it("solo busca en lo que el usuario puede ver", () => {
    const soloLeads = objetivosPermitidos((r) => r === "leads" || r === "documents");
    expect(soloLeads.map((o) => o.grupo)).toEqual(["prospectos", "documentos"]);
    expect(objetivosPermitidos(() => false)).toEqual([]);
  });
  it("nunca busca por correo ni teléfono", () => {
    for (const o of OBJETIVOS) expect(o.campos.join(" ")).not.toMatch(/email|phone/);
  });
  it("arma el filtro y los renglones", () => {
    const docs = OBJETIVOS.find((o) => o.grupo === "documentos")!;
    expect(filtroOr(docs, "PC-12")).toBe("folio.ilike.%PC-12%,title.ilike.%PC-12%");
    expect(aResultado("documentos", { id: "x1", folio: "DOC-1", title: "" }).href).toBe("/app/documents/x1");
    expect(aResultado("documentos", { id: "x1", folio: "DOC-1", title: "" }).titulo).toBe("DOC-1");
    expect(aResultado("prospectos", { id: "p", full_name: "Ana", organization: null }).detalle).toBe("Prospecto");
  });
});
