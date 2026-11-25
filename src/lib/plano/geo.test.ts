import { describe, expect, it } from "vitest";
import { aLocal, area, cono, deLocal, destino, distancia, lados, leerCoordenadas, perimetro, type LngLat } from "./geo";

const origen: LngLat = [-99.2342, 18.9186]; // Cuernavaca

/** Cuadrado de ~lado m, recorrido contra las manecillas (SO → SE → NE → NO). */
function cuadrado(lado: number): LngLat[] {
  const so = origen;
  const se = destino(so, lado, 90);
  const ne = destino(se, lado, 0);
  const no = destino(so, lado, 0);
  return [so, se, ne, no];
}

describe("medidas geográficas", () => {
  it("superficie y perímetro de un predio de 50 × 50 m", () => {
    const c = cuadrado(50);
    expect(area(c)).toBeGreaterThan(2500 * 0.99);
    expect(area(c)).toBeLessThan(2500 * 1.01);
    expect(perimetro(c)).toBeCloseTo(200, 0);
  });

  it("distancia entre dos puntos a 100 m", () => {
    expect(distancia(origen, destino(origen, 100, 45))).toBeCloseTo(100, 3);
  });

  it("cada lado da hacia su orientación, sin importar el sentido del recorrido", () => {
    const c = cuadrado(30);
    expect(lados(c).map((l) => l.orientacion)).toEqual(["sur", "oriente", "norte", "poniente"]);
    const inverso = [...c].reverse();
    expect(lados(inverso).map((l) => l.orientacion).sort()).toEqual(["norte", "oriente", "poniente", "sur"]);
    expect(lados(c)[0].largo).toBeCloseTo(30, 1);
  });

  it("el cono de la cámara empieza en la cámara y cierra", () => {
    const k = cono(origen, 90, 60, 20);
    expect(k[0]).toEqual(origen);
    expect(k[k.length - 1]).toEqual(k[0]);
    expect(distancia(origen, k[1])).toBeCloseTo(20, 3);
  });

  it("ida y vuelta a coordenadas locales en metros", () => {
    const p = destino(origen, 25, 135);
    const l = aLocal(origen, p);
    expect(Math.hypot(l.x, l.y)).toBeCloseTo(25, 0);
    expect(l.y).toBeGreaterThan(0); // hacia el sur es y positiva (como en pantalla)
    const back = deLocal(origen, l);
    expect(back[0]).toBeCloseTo(p[0], 9);
    expect(back[1]).toBeCloseTo(p[1], 9);
  });
});

describe("leer coordenadas pegadas", () => {
  it("acepta lat, lng y enlaces de mapas", () => {
    expect(leerCoordenadas("18.9186, -99.2342")).toEqual([-99.2342, 18.9186]);
    expect(leerCoordenadas("18.9186 -99.2342")).toEqual([-99.2342, 18.9186]);
    expect(leerCoordenadas("https://www.google.com/maps/@18.9186,-99.2342,17z")).toEqual([-99.2342, 18.9186]);
    expect(leerCoordenadas("https://maps.example.com/?q=18.9,-99.2")).toEqual([-99.2, 18.9]);
  });
  it("rechaza lo que no son coordenadas", () => {
    expect(leerCoordenadas("Av. Morelos 100, Cuernavaca")).toBeNull();
    expect(leerCoordenadas("95, 200")).toBeNull();
  });
});
