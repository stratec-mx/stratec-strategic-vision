import { describe, expect, it } from "vitest";
import { lecturas, rutaCorta, segundos, variacion, type DatosGoogle } from "./googleInsights";
import {
  b64url, fechaGa, leerCuenta, oportunidades, pemADer, periodoValido, rangos, totalesGa,
} from "../../supabase/functions/google-insights/logica";

describe("logica de google-insights", () => {
  it("arma el periodo actual y el anterior sin traslape, con el retraso de la fuente", () => {
    const hoy = new Date("2026-11-14T18:00:00Z"); // 12:00 en Cuernavaca
    const { actual, anterior } = rangos(hoy, 28, 3);
    expect(actual).toEqual({ inicio: "2026-10-15", fin: "2026-11-11" });
    expect(anterior).toEqual({ inicio: "2026-09-17", fin: "2026-10-14" });
  });

  it("usa la fecha de Cuernavaca aunque en UTC ya sea el día siguiente", () => {
    const noche = new Date("2026-11-15T03:00:00Z"); // 21:00 del 14 en Cuernavaca
    expect(rangos(noche, 7, 1).actual.fin).toBe("2026-11-13");
  });

  it("solo acepta periodos de 7, 28 o 90 días", () => {
    expect(periodoValido(7)).toBe(7);
    expect(periodoValido("90")).toBe(90);
    expect(periodoValido(365)).toBe(28);
    expect(periodoValido(undefined)).toBe(28);
  });

  it("detecta oportunidades: muchas impresiones, pocos clics, posición alcanzable", () => {
    const rows = [
      { keys: ["programa interno proteccion civil"], clicks: 0, impressions: 120, ctr: 0, position: 9 },
      { keys: ["stratec"], clicks: 30, impressions: 40, ctr: 0.75, position: 1.2 },
      { keys: ["muy lejos"], clicks: 0, impressions: 300, ctr: 0, position: 48 },
      { keys: ["pocas"], clicks: 0, impressions: 4, ctr: 0, position: 8 },
      { keys: ["analisis de riesgo cuernavaca"], clicks: 1, impressions: 60, ctr: 0.0167, position: 7 },
    ];
    expect(oportunidades(rows).map((o) => o.clave)).toEqual(["programa interno proteccion civil", "analisis de riesgo cuernavaca"]);
  });

  it("separa los totales de GA4 por periodo y convierte la interacción a %", () => {
    const t = totalesGa({
      rows: [
        { dimensionValues: [{ value: "actual" }], metricValues: [{ value: "120" }, { value: "90" }, { value: "150" }, { value: "0.6123" }, { value: "75.4" }] },
        { dimensionValues: [{ value: "anterior" }], metricValues: [{ value: "100" }, { value: "80" }, { value: "130" }, { value: "0.5" }, { value: "60" }] },
      ],
    });
    expect(t.actual).toEqual({ usuarios: 120, nuevos: 90, sesiones: 150, interaccion: 61.23, duracion: 75 });
    expect(t.anterior.usuarios).toBe(100);
    expect(totalesGa(undefined).actual.usuarios).toBe(0);
  });

  it("convierte fechas de GA4", () => {
    expect(fechaGa("20261103")).toBe("2026-11-03");
  });

  it("valida la llave de la cuenta de servicio sin aceptar JSON incompleto", () => {
    expect(leerCuenta(undefined)).toBeNull();
    expect(leerCuenta("no es json")).toBeNull();
    expect(leerCuenta(JSON.stringify({ client_email: "x@y.iam.gserviceaccount.com" }))).toBeNull();
    const ok = leerCuenta(JSON.stringify({ client_email: "x@y.iam.gserviceaccount.com", private_key: "-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n" }));
    expect(ok?.client_email).toBe("x@y.iam.gserviceaccount.com");
  });

  it("decodifica el PEM y codifica base64url sin relleno", () => {
    expect(Array.from(pemADer("-----BEGIN PRIVATE KEY-----\nAQID\n-----END PRIVATE KEY-----\n"))).toEqual([1, 2, 3]);
    expect(b64url(new Uint8Array([251, 255]))).toBe("-_8");
    expect(b64url('{"a":1}')).toBe("eyJhIjoxfQ");
  });
});

describe("lecturas para el panel", () => {
  it("acorta rutas y nombra la página de inicio", () => {
    expect(rutaCorta("https://www.stratecsecurity.com/")).toBe("Inicio");
    expect(rutaCorta("https://www.stratecsecurity.com/servicios/brigadas?x=1")).toBe("/servicios/brigadas");
    expect(rutaCorta("/diagnostico?utm_source=g")).toBe("/diagnostico");
  });

  it("calcula variaciones y formatea tiempos", () => {
    expect(variacion(120, 100)).toBe(20);
    expect(variacion(5, 0)).toBeNull();
    expect(segundos(75)).toBe("1 min 15 s");
    expect(segundos(42)).toBe("42 s");
  });

  it("resume en lenguaje simple lo más relevante", () => {
    const d: DatosGoogle = {
      dias: 28, generado: "2026-11-14T18:00:00Z", cuenta: null,
      gsc: {
        ok: true, rango: { inicio: "2026-10-15", fin: "2026-11-11" },
        totales: { actual: { clics: 30, impresiones: 1200, ctr: 2.5, posicion: 12 }, anterior: { clics: 20, impresiones: 900, ctr: 2.2, posicion: 14 } },
        diario: [], paginas: [], dispositivos: [],
        consultas: [{ clave: "stratec security", clics: 10, impresiones: 30, ctr: 33, posicion: 1 }],
        oportunidades: [{ clave: "programa interno", clics: 0, impresiones: 120, ctr: 0, posicion: 9 }],
      },
      ga4: {
        ok: true, rango: { inicio: "2026-10-17", fin: "2026-11-13" },
        totales: { actual: { usuarios: 100, nuevos: 80, sesiones: 140, interaccion: 55, duracion: 70 }, anterior: { usuarios: 90, nuevos: 70, sesiones: 120, interaccion: 50, duracion: 60 } },
        canales: [{ nombre: "Organic Search", sesiones: 70, usuarios: 50 }, { nombre: "Direct", sesiones: 70, usuarios: 50 }],
        ciudades: [{ nombre: "(not set)", usuarios: 30 }, { nombre: "Cuernavaca", usuarios: 25 }],
        entradas: [], diario: [], fuentes: [],
        dispositivos: [{ nombre: "mobile", usuarios: 75 }, { nombre: "desktop", usuarios: 25 }],
        acciones: [{ evento: "click_whatsapp", total: 12 }, { evento: "generate_lead", total: 3 }],
      },
    };
    const l = lecturas(d);
    expect(l[0]).toContain("+50%");
    expect(l.join(" ")).toContain("«stratec security»");
    expect(l.join(" ")).toContain("«programa interno»");
    expect(l.join(" ")).toContain("75% de tus visitantes entra desde el teléfono");
    expect(l.join(" ")).toContain("Búsqueda en Google (orgánica) (50% de las visitas)");
    expect(l.join(" ")).toContain("Cuernavaca");
    expect(l.join(" ")).toContain("3 dejaron sus datos y 12 dieron clic en WhatsApp");
  });

  it("no inventa lecturas si las fuentes no están conectadas", () => {
    expect(lecturas({ dias: 28, generado: "", cuenta: null, gsc: { ok: false, motivo: "sin_configurar" }, ga4: { ok: false, motivo: "sin_acceso" } })).toEqual([]);
  });
});
