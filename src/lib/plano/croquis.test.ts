import { describe, expect, it } from "vitest";
import {
  agregarAbertura, agregarEscalera, agregarMuro, borrarEscalera, borrarMuro, cambiarEscalera, cambiarEspacio,
  detectarCaras, dentro, fijarLargo, iman, largoMuro, moverMuro, moverVertice, nivelVacio, poligonoEspacio,
  posicionAbertura, puntoInterior, replicarNivel, seSaleDelPredio, superficie, type Croquis, type Nivel, type P,
} from "./croquis";

/** Dibuja una cadena cerrada de muros por sus esquinas. */
function cadena(n: Nivel, pts: P[]): Nivel {
  let r = n;
  for (let i = 0; i < pts.length; i++) r = agregarMuro(r, pts[i], pts[(i + 1) % pts.length]);
  return r;
}

const cuarto = () => cadena(nivelVacio("Planta baja"), [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 6 }, { x: 0, y: 6 }]);
const areas = (n: Nivel) => n.espacios.map((e) => Math.round(superficie(poligonoEspacio(n, e)) * 100) / 100).sort((a, b) => a - b);

describe("croquis: reconoce espacios", () => {
  it("cuatro muros que cierran un recinto forman un espacio con su superficie", () => {
    const n = cuarto();
    expect(n.muros).toHaveLength(4);
    expect(n.espacios).toHaveLength(1);
    expect(areas(n)).toEqual([60]);
    expect(n.espacios[0].pendiente).toBe(true);
  });

  it("un muro abierto no forma espacio", () => {
    let n = nivelVacio("PB");
    n = agregarMuro(n, { x: 0, y: 0 }, { x: 5, y: 0 });
    n = agregarMuro(n, { x: 5, y: 0 }, { x: 5, y: 5 });
    expect(n.espacios).toHaveLength(0);
    expect(detectarCaras(n)).toHaveLength(0);
  });

  it("un muro interior divide el espacio; el mayor conserva el nombre", () => {
    let n = cuarto();
    n = cambiarEspacio(n, n.espacios[0].id, { nombre: "Oficina general", tipo: "oficina" });
    n = agregarMuro(n, { x: 7, y: 0 }, { x: 7, y: 6 });
    expect(areas(n)).toEqual([18, 42]);
    const mayor = n.espacios.find((e) => superficie(poligonoEspacio(n, e)) > 40)!;
    const menor = n.espacios.find((e) => e !== mayor)!;
    expect(mayor.nombre).toBe("Oficina general");
    expect(mayor.tipo).toBe("oficina");
    expect(menor.pendiente).toBe(true);
  });

  it("borrar el muro une los dos espacios y conserva el nombre del mayor", () => {
    let n = cuarto();
    n = agregarMuro(n, { x: 7, y: 0 }, { x: 7, y: 6 });
    const [a, b] = n.espacios;
    const grande = superficie(poligonoEspacio(n, a)) > superficie(poligonoEspacio(n, b)) ? a : b;
    const chico = grande === a ? b : a;
    n = cambiarEspacio(n, grande.id, { nombre: "Lobby", tipo: "lobby" });
    n = cambiarEspacio(n, chico.id, { nombre: "Bodega", tipo: "bodega" });
    const interior = n.muros.find((m) => {
      const pa = n.vertices.find((v) => v.id === m.a)!;
      const pb = n.vertices.find((v) => v.id === m.b)!;
      return pa.x === 7 && pb.x === 7;
    })!;
    n = borrarMuro(n, interior.id);
    expect(n.espacios).toHaveLength(1);
    expect(n.espacios[0].nombre).toBe("Lobby");
    expect(areas(n)).toEqual([60]);
    // Los muros de arriba y abajo vuelven a ser uno solo.
    expect(n.muros).toHaveLength(4);
  });

  it("mover un muro ajusta los espacios que lo comparten y les deja su nombre", () => {
    let n = cuarto();
    n = agregarMuro(n, { x: 5, y: 0 }, { x: 5, y: 6 });
    n = n.espacios.reduce((acc, e, i) => cambiarEspacio(acc, e.id, { nombre: `Cuarto ${i + 1}` }), n);
    const nombresAntes = n.espacios.map((e) => e.nombre).sort();
    const medio = n.muros.find((m) => {
      const pa = n.vertices.find((v) => v.id === m.a)!;
      const pb = n.vertices.find((v) => v.id === m.b)!;
      return pa.x === 5 && pb.x === 5;
    })!;
    n = moverMuro(n, medio.id, 2, 0);
    expect(areas(n)).toEqual([18, 42]);
    expect(n.espacios.map((e) => e.nombre).sort()).toEqual(nombresAntes);
    expect(n.espacios.every((e) => !e.pendiente)).toBe(true);
  });

  it("editar la cota mueve el muro y cambia la superficie", () => {
    let n = cuarto();
    const abajo = n.muros.find((m) => {
      const pa = n.vertices.find((v) => v.id === m.a)!;
      const pb = n.vertices.find((v) => v.id === m.b)!;
      return pa.y === 0 && pb.y === 0;
    })!;
    n = fijarLargo(n, abajo.id, 12);
    expect(largoMuro(n, n.muros.find((m) => m.id === abajo.id)!)).toBeCloseTo(12, 6);
    // La esquina movida arrastra el muro lateral: el recinto ya no es rectangular pero sigue cerrado.
    expect(n.espacios).toHaveLength(1);
  });

  it("dos muros que se cruzan crean una esquina y cuatro espacios", () => {
    let n = cuarto();
    n = agregarMuro(n, { x: 5, y: 0 }, { x: 5, y: 6 });
    n = agregarMuro(n, { x: 0, y: 3 }, { x: 10, y: 3 });
    expect(areas(n)).toEqual([15, 15, 15, 15]);
  });

  it("mover una esquina compartida cambia los dos espacios", () => {
    let n = cuarto();
    n = agregarMuro(n, { x: 5, y: 0 }, { x: 5, y: 6 });
    const esquina = n.vertices.find((v) => v.x === 5 && v.y === 6)!;
    n = moverVertice(n, esquina.id, { x: 6, y: 6 });
    expect(areas(n)).toEqual([27, 33]);
  });
});

describe("croquis: puertas y ventanas", () => {
  it("la puerta queda pegada al muro aunque el muro se parta o se mueva", () => {
    let n = cuarto();
    const abajo = n.muros.find((m) => {
      const pa = n.vertices.find((v) => v.id === m.a)!;
      const pb = n.vertices.find((v) => v.id === m.b)!;
      return pa.y === 0 && pb.y === 0;
    })!;
    const t = (() => {
      const pa = n.vertices.find((v) => v.id === abajo.a)!;
      return pa.x === 0 ? 0.8 : 0.2; // x = 8
    })();
    n = agregarAbertura(n, abajo.id, t, "puerta");
    expect(posicionAbertura(n, n.aberturas[0])!.x).toBeCloseTo(8, 6);
    // Un muro interior que llega al muro de abajo lo parte en x = 5.
    n = agregarMuro(n, { x: 5, y: 0 }, { x: 5, y: 6 });
    expect(n.aberturas).toHaveLength(1);
    expect(posicionAbertura(n, n.aberturas[0])!.x).toBeCloseTo(8, 6);
    // Mover el muro de abajo 1 m hacia arriba mueve la puerta con él.
    const conPuerta = n.muros.find((m) => m.id === n.aberturas[0].muro)!;
    n = moverMuro(n, conPuerta.id, 0, 1);
    expect(posicionAbertura(n, n.aberturas[0])!.y).toBeCloseTo(1, 6);
  });

  it("borrar el muro borra sus aberturas", () => {
    let n = cuarto();
    n = agregarAbertura(n, n.muros[0].id, 0.5, "ventana");
    n = borrarMuro(n, n.muros[0].id);
    expect(n.aberturas).toHaveLength(0);
  });
});

describe("croquis: niveles y escaleras", () => {
  const dosNiveles = (): Croquis => {
    const pb = cuarto();
    const n1 = nivelVacio("Nivel 1", 3);
    return { niveles: [pb, n1] };
  };

  it("una escalera que sube aparece también en el nivel al que llega, bajando", () => {
    let c = dosNiveles();
    const [pb, n1] = c.niveles;
    c = agregarEscalera(c, pb.id, { x: 2, y: 2, ancho: 1.2, largo: 3, giro: 0, sentido: "sube", nivelDestino: n1.id });
    const arriba = c.niveles[1].escaleras;
    expect(arriba).toHaveLength(1);
    expect(arriba[0].sentido).toBe("baja");
    expect(arriba[0].nivelDestino).toBe(pb.id);
    c = cambiarEscalera(c, pb.id, c.niveles[0].escaleras[0].id, { x: 4 });
    expect(c.niveles[1].escaleras[0].x).toBe(4);
    c = borrarEscalera(c, pb.id, c.niveles[0].escaleras[0].id);
    expect(c.niveles[0].escaleras).toHaveLength(0);
    expect(c.niveles[1].escaleras).toHaveLength(0);
  });

  it("replicar planta copia todo con identificadores nuevos y sube el nivel de piso", () => {
    let c = dosNiveles();
    c = { niveles: [cambiarEspacio(c.niveles[0], c.niveles[0].espacios[0].id, { nombre: "Depto 101" }), c.niveles[1]] };
    c = replicarNivel(c, c.niveles[0].id, "Nivel 1 bis");
    expect(c.niveles).toHaveLength(3);
    const [o, copia] = c.niveles;
    expect(copia.nombre).toBe("Nivel 1 bis");
    expect(copia.nivelPiso).toBe(3);
    expect(areas(copia)).toEqual(areas(o));
    expect(copia.espacios[0].nombre).toBe("Depto 101");
    const idsO = new Set([...o.vertices.map((v) => v.id), ...o.muros.map((m) => m.id)]);
    expect([...copia.vertices, ...copia.muros].some((x) => idsO.has(x.id))).toBe(false);
  });
});

describe("croquis: imán y predio", () => {
  it("se pega a una esquina cercana", () => {
    const n = cuarto();
    const r = iman(n, { x: 10.05, y: 5.97 }, { tol: 0.2, rejilla: 0.5 });
    expect(r.guia).toBe("vertice");
    expect(r.p).toEqual({ x: 10, y: 6 });
  });

  it("desde un punto de partida, endereza a 90° y redondea el largo", () => {
    const n = nivelVacio("PB");
    const r = iman(n, { x: 3.02, y: 0.3 }, { tol: 0.1, rejilla: 0.5, origen: { x: 0, y: 0 } });
    expect(r.p.y).toBeCloseTo(0, 9);
    expect(r.p.x).toBeCloseTo(3, 9);
  });

  it("sin punto de partida, se pega al muro", () => {
    const n = cuarto();
    const r = iman(n, { x: 4.33, y: 0.08 }, { tol: 0.2, rejilla: 0.5 });
    expect(r.guia).toBe("muro");
    expect(r.p.y).toBeCloseTo(0, 9);
  });

  it("avisa si el croquis se sale del predio", () => {
    const n = cuarto();
    expect(seSaleDelPredio(n, [{ x: -1, y: -1 }, { x: 11, y: -1 }, { x: 11, y: 7 }, { x: -1, y: 7 }])).toBe(false);
    expect(seSaleDelPredio(n, [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 6 }, { x: 0, y: 6 }])).toBe(true);
  });

  it("encuentra un punto interior en un polígono en L", () => {
    const L = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 10 }, { x: 0, y: 10 }];
    expect(dentro(puntoInterior(L), L)).toBe(true);
  });
});
