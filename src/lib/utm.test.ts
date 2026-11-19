import { beforeEach, describe, expect, it } from "vitest";
import { captureUtm, readUtm, utmLines } from "./utm";

describe("UTM de campañas", () => {
  beforeEach(() => sessionStorage.clear());

  it("lee los cuatro parámetros y descarta los demás y los vacíos", () => {
    expect(
      readUtm("?utm_source=facebook&utm_medium=organico&utm_campaign=extorsion-nov&utm_term=x&fbclid=abc&utm_content="),
    ).toEqual({ utm_source: "facebook", utm_medium: "organico", utm_campaign: "extorsion-nov" });
    expect(readUtm("?utm_content=video%201")).toEqual({ utm_content: "video 1" });
  });

  it("recorta valores muy largos", () => {
    expect(readUtm(`?utm_source=${"a".repeat(300)}`).utm_source).toHaveLength(100);
  });

  it("los conserva en la sesión si el visitante regresa sin ellos en la URL", () => {
    captureUtm("?utm_source=whatsapp&utm_campaign=civac");
    expect(captureUtm("")).toEqual({ utm_source: "whatsapp", utm_campaign: "civac" });
  });

  it("una campaña nueva reemplaza a la guardada", () => {
    captureUtm("?utm_source=whatsapp&utm_campaign=civac");
    expect(captureUtm("?utm_source=facebook")).toEqual({ utm_source: "facebook" });
    expect(captureUtm("")).toEqual({ utm_source: "facebook" });
  });

  it("ignora datos guardados dañados", () => {
    sessionStorage.setItem("stratec_utm", "{no es json");
    expect(captureUtm("")).toEqual({});
  });

  it("arma las líneas de la nota del lead", () => {
    expect(utmLines({ utm_source: "facebook", utm_content: "post1" })).toEqual(["utm_source: facebook", "utm_content: post1"]);
    expect(utmLines({})).toEqual(["Sin UTM (visita directa o enlace sin etiquetar)"]);
  });
});
