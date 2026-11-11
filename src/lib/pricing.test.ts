import { describe, it, expect } from "vitest";
import { classify, suggestPrice, priceDeviation, quoteTraceSummary, DEFAULT_PROFILE, type ClientProfile, type ServiceRate, type PriceTrace } from "./pricing";

// Tarifas de EJEMPLO (las reales se capturan en el panel). Básica / intermedia / avanzada.
const RATES: Record<string, ServiceRate> = {
  "STR-02.1": { code: "STR-02.1", price_low: 18000, price_medium: 32000, price_high: 55000, extra_site_pct: 50 },
  "STR-01.1": { code: "STR-01.1", price_low: 25000, price_medium: 45000, price_high: 80000, extra_site_pct: 40 },
};
const perfil = (p: Partial<ClientProfile>): ClientProfile => ({ ...DEFAULT_PROFILE, ...p });
const precio = (code: string, p: ClientProfile) => suggestPrice(code, RATES, classify(p))?.price;

const oficinaChica = perfil({ giro: "oficinas", area: 300, people: 20, floors: 1 });
const gasolinera = perfil({ giro: "peligroso", hazmat: "significativo", area: 300, people: 10, floors: 1 });
const corporativo = perfil({ giro: "oficinas", area: 6000, people: 400, floors: 8 });

describe("Modelo de precios: riesgo, complejidad y alcance separados", () => {
  it("1 · Un cliente, un inmueble: tarifa básica", () => {
    const c = classify(oficinaChica);
    expect(c.risk).toBe("bajo");
    expect(c.complexity).toBe("basica");
    expect(c.scope).toBe("un_inmueble");
    expect(precio("STR-02.1", oficinaChica)).toBe(18000);
  });

  it("2 · Un cliente, tres inmuebles: el % por inmueble se aplica una vez y la tarifa no sube de nivel", () => {
    const tres = { ...oficinaChica, sites: 3 };
    const c = classify(tres);
    expect(c.complexity).toBe("basica"); // antes: el tamaño pasaba a "mediana" por tener varios inmuebles
    expect(c.scope).toBe("varios_inmuebles");
    expect(precio("STR-02.1", tres)).toBe(18000 * (1 + 2 * 0.5)); // 36,000
    expect(precio("STR-01.1", tres)).toBe(25000 * (1 + 2 * 0.4)); // 45,000 (antes 81,000)
  });

  it("3 · Dos sedes con distinto riesgo: mismo precio si el esfuerzo es igual", () => {
    expect(classify(oficinaChica).risk).not.toBe(classify(gasolinera).risk);
    expect(precio("STR-02.1", oficinaChica)).toBe(precio("STR-02.1", gasolinera));
    const dosSedes = { ...gasolinera, sites: 2, scope: "varias_sedes" as const };
    expect(classify(dosSedes).scope).toBe("varias_sedes");
    expect(precio("STR-02.1", dosSedes)).toBe(27000);
  });

  it("4 · Riesgo crítico con complejidad básica: el riesgo no encarece", () => {
    const c = classify(gasolinera);
    expect(c.risk).toBe("critico");
    expect(c.complexity).toBe("basica");
    expect(precio("STR-02.1", gasolinera)).toBe(18000); // antes 55,000
  });

  it("5 · Riesgo medio con complejidad avanzada: se reconoce el esfuerzo", () => {
    const c = classify(corporativo);
    expect(c.risk).toBe("medio");
    expect(c.complexity).toBe("avanzada");
    expect(precio("STR-02.1", corporativo)).toBe(55000);
  });

  it("5b · Un proyecto crítico puede costar menos que uno de riesgo medio", () => {
    expect(precio("STR-02.1", gasolinera)!).toBeLessThan(precio("STR-02.1", corporativo)!);
  });

  it("5c · La complejidad fijada a mano por el consultor manda", () => {
    const c = classify({ ...gasolinera, complexity: "intermedia" });
    expect(c.complexitySuggested).toBe("basica");
    expect(c.complexity).toBe("intermedia");
    expect(precio("STR-02.1", { ...gasolinera, complexity: "intermedia" })).toBe(32000);
  });

  it("6 · Descuento dentro del rango: se registra sin exigir justificación", () => {
    expect(priceDeviation(16000, 18000)).toEqual({ pct: -11.1, outOfRange: false });
    expect(priceDeviation(22000, 18000)).toEqual({ pct: 22.2, outOfRange: false });
  });

  it("7 · Precio fuera de rango: genera alerta (−15 % / +25 %)", () => {
    expect(priceDeviation(14000, 18000)).toEqual({ pct: -22.2, outOfRange: true });
    expect(priceDeviation(23000, 18000).outOfRange).toBe(true);
    expect(priceDeviation(5000, null)).toEqual({ pct: null, outOfRange: false }); // sin tarifa no hay alerta
  });

  it("8 · Cotización histórica (sin registro de precio): se reconoce y no se altera", () => {
    const antiguos = [{ code: "STR-02.1", title: "PIPC", description: "", qty: 1, unit_price: 20000, hours: 10 }];
    const copia = JSON.parse(JSON.stringify(antiguos));
    expect(quoteTraceSummary(antiguos)).toBeNull();
    expect(antiguos).toEqual(copia);
  });

  it("8b · Cotización nueva: resumen de sugerido contra final", () => {
    const traza = (suggested: number | null, out = false): PriceTrace => ({
      suggested, basis: "", risk: "bajo", complexity: "basica", complexity_manual: false, scope: "un_inmueble", sites: 1,
      deviation_pct: null, out_of_range: out, reason: out ? "Cliente recurrente con convenio" : "", by: "consultor@stratec", at: "2026-11-11T18:00:00Z",
    });
    const items = [
      { qty: 1, unit_price: 14000, pricing: traza(18000, true) },
      { qty: 2, unit_price: 3000, pricing: traza(null) }, // viáticos: sin tarifa, no cuentan en el sugerido
    ];
    expect(quoteTraceSummary(items)).toEqual({ suggested: 18000, final: 14000, deviationPct: -22.2, review: true, by: "consultor@stratec" });
  });

  it("Un solo inmueble con alcance 'varios' se corrige a 'un inmueble'; 'integral' se respeta", () => {
    expect(classify(perfil({ sites: 1, scope: "varias_sedes" })).scope).toBe("un_inmueble");
    expect(classify(perfil({ sites: 1, scope: "integral" })).scope).toBe("integral");
    expect(classify(perfil({ sites: 4, scope: "un_inmueble" })).scope).toBe("varios_inmuebles");
  });

  it("Sin tarifa capturada para la complejidad no hay sugerencia", () => {
    const sinAvanzada = { ...RATES, "STR-02.1": { ...RATES["STR-02.1"], price_high: null } };
    expect(suggestPrice("STR-02.1", sinAvanzada, classify(corporativo))).toBeNull();
    expect(suggestPrice("STR-99", RATES, classify(corporativo))).toBeNull();
  });
});
