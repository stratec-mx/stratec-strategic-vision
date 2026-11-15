import { describe, expect, it } from "vitest";
import { rutaLimpia } from "./rutaLimpia";

describe("rutaLimpia: enlaces con signos pegados al final", () => {
  it("deja igual las rutas correctas", () => {
    for (const r of ["/", "/diagnostico", "/diagnostico/", "/servicios/videovigilancia-cctv", "/cobertura/morelos/cuernavaca", "/no-existe"]) {
      expect(rutaLimpia(r)).toBe(r);
    }
  });

  it("quita paréntesis, puntos, comas y asteriscos de negritas", () => {
    expect(rutaLimpia("/diagnostico)")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico.")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico,")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico*")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico**")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico_")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico).")).toBe("/diagnostico");
    expect(rutaLimpia("/schedule]")).toBe("/schedule");
    expect(rutaLimpia("/servicios/capacitacion;")).toBe("/servicios/capacitacion");
  });

  it("quita signos que el navegador manda codificados (comillas, espacios, »)", () => {
    expect(rutaLimpia("/diagnostico%22")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico%C2%BB")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico%E2%80%9D")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico%20")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico%3E")).toBe("/diagnostico");
  });

  it("también cuando el signo quedó antes de una barra final", () => {
    expect(rutaLimpia("/diagnostico)/")).toBe("/diagnostico");
    expect(rutaLimpia("/diagnostico/.")).toBe("/diagnostico/");
  });

  it("una ruta de puros signos lleva al inicio", () => {
    expect(rutaLimpia("/)")).toBe("/");
    expect(rutaLimpia("/*")).toBe("/");
  });

  it("no falla con una codificación inválida", () => {
    expect(rutaLimpia("/diagnostico%E0%A4%A")).toBe("/diagnostico%E0%A4%A");
    expect(rutaLimpia("/diagnostico%)")).toBe("/diagnostico");
  });
});
