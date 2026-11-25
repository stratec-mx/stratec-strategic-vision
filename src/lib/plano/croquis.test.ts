import { describe, expect, it } from "vitest";
import {
  ANCHO_ABERTURA, GROSOR_VIRTUAL, agregarAbertura, agregarEscalera, agregarMuro, anguloHacia, areaConSigno, borrarEscalera,
  borrarMuro, cambiarAbertura, cambiarClaseAbertura, cambiarEscalera, cambiarEspacio, cambiarGrosor, cambiarTipoMuro,
  claseAbertura, deslizarAbertura, detectarCaras, dentro, escaleraAMundo, escaleraInicial, fijarLargo, giroConPaso, iman,
  largoMuro, manijaGiro, moverMuro, moverVertice, muroCercano, nivelVacio, normalizarGiro, poligonoEspacio,
  posicionAbertura, puntoInterior, replicarNivel, seSaleDelPredio, superficie, trazoEscalera,
  type Abertura, type Croquis, type Escalera, type Nivel, type P,
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

/** Muro del nivel cuyos dos extremos cumplen la condición. */
const muroDonde = (n: Nivel, f: (a: P, b: P) => boolean) =>
  n.muros.find((m) => f(n.vertices.find((v) => v.id === m.a)!, n.vertices.find((v) => v.id === m.b)!))!;
const abajoDe = (n: Nivel) => muroDonde(n, (a, b) => a.y === 0 && b.y === 0);
/** t sobre el muro de abajo del cuarto para la x dada (el muro puede ir en cualquier sentido). */
const tEnX = (n: Nivel, x: number) => {
  const m = abajoDe(n);
  const a = n.vertices.find((v) => v.id === m.a)!;
  return a.x === 0 ? x / 10 : 1 - x / 10;
};

describe("croquis: tipos de puertas", () => {
  it("los datos viejos sin subtipo siguen siendo puertas abatibles", () => {
    const vieja: Abertura = { id: "a1", muro: "m1", t: 0.5, ancho: 0.9, tipo: "puerta", bisagra: "inicio", lado: 1 };
    expect(claseAbertura(vieja)).toBe("abatible");
    expect(claseAbertura({ tipo: "ventana" })).toBe("ventana");
    // El tipo viejo "puerta" se sigue aceptando al colocar.
    const c = cuarto();
    const r = agregarAbertura(c, c.muros[0].id, 0.5, "puerta");
    expect(claseAbertura(r.aberturas[0])).toBe("abatible");
    expect(r.aberturas[0].ancho).toBe(ANCHO_ABERTURA.abatible);
  });

  it("cada variante toma su ancho típico y un portón no pasa del largo del muro", () => {
    let n = cuarto();
    n = agregarAbertura(n, abajoDe(n).id, 0.5, "porton_corredizo");
    const ab = n.aberturas[0];
    expect(ab.tipo).toBe("puerta");
    expect(ab.subtipo).toBe("porton_corredizo");
    expect(ab.ancho).toBe(4);
    n = cambiarClaseAbertura(n, ab.id, "ventana");
    expect(n.aberturas[0].tipo).toBe("ventana");
    expect(n.aberturas[0].subtipo).toBeUndefined();
    expect(n.aberturas[0].ancho).toBe(ANCHO_ABERTURA.ventana);
    n = cambiarClaseAbertura(n, ab.id, "doble");
    expect(claseAbertura(n.aberturas[0])).toBe("doble");
    // En un muro de 3 m, un portón de 4 m se recorta al largo del muro.
    let chico = cadena(nivelVacio("PB"), [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 2 }, { x: 0, y: 2 }]);
    chico = agregarAbertura(chico, abajoDe(chico).id, 0.5, "ventana");
    chico = cambiarClaseAbertura(chico, chico.aberturas[0].id, "porton_abatible");
    expect(chico.aberturas[0].ancho).toBeCloseTo(3, 9);
  });
});

describe("croquis: arrastrar puertas y ventanas", () => {
  it("se desliza por su muro aunque el puntero pase cerca de una esquina", () => {
    let n = cuarto();
    n = agregarAbertura(n, abajoDe(n).id, tEnX(n, 5), "ventana");
    const id = n.aberturas[0].id;
    // Cerca de la esquina (10, 0): el muro de la derecha queda a 0.1 m, pero se queda en el suyo.
    n = deslizarAbertura(n, id, { x: 9.9, y: 0.15 }, 0.3);
    expect(n.aberturas[0].muro).toBe(abajoDe(n).id);
    // Llega hasta donde cabe completa: 10 - 1.2 / 2.
    expect(posicionAbertura(n, n.aberturas[0])!.x).toBeCloseTo(9.4, 6);
  });

  it("pasa a otro muro solo si el puntero se aleja del suyo", () => {
    let n = cuarto();
    n = agregarAbertura(n, abajoDe(n).id, tEnX(n, 5), "puerta");
    const id = n.aberturas[0].id;
    n = deslizarAbertura(n, id, { x: 4, y: 5.9 }, 0.3);
    const arriba = muroDonde(n, (a, b) => a.y === 6 && b.y === 6);
    expect(n.aberturas[0].muro).toBe(arriba.id);
    expect(posicionAbertura(n, n.aberturas[0])!.x).toBeCloseTo(4, 6);
    // Lejos de todo muro: sigue deslizándose por el suyo.
    n = deslizarAbertura(n, id, { x: 7, y: 3 }, 0.3);
    expect(n.aberturas[0].muro).toBe(arriba.id);
    expect(posicionAbertura(n, n.aberturas[0])!.x).toBeCloseTo(7, 6);
  });
});

describe("croquis: líneas divisorias", () => {
  it("dividen el espacio igual que un muro, sin grosor físico", () => {
    let n = cuarto();
    n = agregarMuro(n, { x: 7, y: 0 }, { x: 7, y: 6 }, 0.15, true);
    expect(areas(n)).toEqual([18, 42]);
    const linea = n.muros.find((m) => m.virtual)!;
    expect(linea.grosor).toBe(GROSOR_VIRTUAL);
    // No se le puede cambiar el grosor.
    expect(cambiarGrosor(n, linea.id, 0.3).muros.find((m) => m.id === linea.id)!.grosor).toBe(GROSOR_VIRTUAL);
    // Borrarla vuelve a unir los espacios.
    n = borrarMuro(n, linea.id);
    expect(areas(n)).toEqual([60]);
  });

  it("al partirse, los dos pedazos siguen siendo línea divisoria", () => {
    let n = cuarto();
    n = agregarMuro(n, { x: 5, y: 0 }, { x: 5, y: 6 }, 0.15, true);
    n = agregarMuro(n, { x: 0, y: 3 }, { x: 10, y: 3 });
    expect(areas(n)).toEqual([15, 15, 15, 15]);
    const verticales = n.muros.filter((m) => {
      const a = n.vertices.find((v) => v.id === m.a)!;
      const b = n.vertices.find((v) => v.id === m.b)!;
      return a.x === 5 && b.x === 5;
    });
    expect(verticales).toHaveLength(2);
    expect(verticales.every((m) => m.virtual)).toBe(true);
  });

  it("delimita cajones de estacionamiento dentro de un espacio", () => {
    let n = cadena(nivelVacio("Sótano"), [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }]);
    for (const x of [2.5, 5, 7.5]) n = agregarMuro(n, { x, y: 0 }, { x, y: 5 }, 0.15, true);
    expect(areas(n)).toEqual([12.5, 12.5, 12.5, 12.5]);
    n = cambiarEspacio(n, n.espacios[0].id, { nombre: "Cajón 1", tipo: "cajon_estacionamiento" });
    expect(n.espacios[0].tipo).toBe("cajon_estacionamiento");
  });

  it("no admite puertas ni ventanas y al volverse divisoria pierde las suyas", () => {
    let n = cuarto();
    n = agregarMuro(n, { x: 7, y: 0 }, { x: 7, y: 6 }, 0.15, true);
    const linea = n.muros.find((m) => m.virtual)!;
    expect(agregarAbertura(n, linea.id, 0.5, "abatible").aberturas).toHaveLength(0);
    expect(muroCercano(n, { x: 7.05, y: 3 }, 0.2, { soloFisicos: true })).toBeNull();
    // Una puerta no se puede pasar a una línea divisoria.
    const fisico = muroDonde(n, (a, b) => a.x === 0 && b.x === 0);
    n = agregarAbertura(n, fisico.id, 0.5, "abatible");
    const ab = n.aberturas[0];
    expect(cambiarAbertura(n, ab.id, { muro: linea.id })).toBe(n);
    // Cambiar a divisoria el muro con puerta quita la puerta; de vuelta a físico toma el grosor.
    n = cambiarTipoMuro(n, fisico.id, true);
    expect(n.aberturas).toHaveLength(0);
    expect(n.muros.find((m) => m.id === fisico.id)!.virtual).toBe(true);
    n = cambiarTipoMuro(n, fisico.id, false, 0.2);
    const otraVez = n.muros.find((m) => m.id === fisico.id)!;
    expect(otraVez.virtual).toBeFalsy();
    expect(otraVez.grosor).toBe(0.2);
    // Los espacios no cambian al cambiar el tipo de trazo.
    expect(areas(n)).toEqual([18, 42]);
  });

  it("una línea divisoria encima de un muro deja el muro físico", () => {
    let n = cuarto();
    n = agregarMuro(n, { x: 0, y: 0 }, { x: 10, y: 0 }, 0.15, true);
    const abajo = n.muros.filter((m) => {
      const a = n.vertices.find((v) => v.id === m.a)!;
      const b = n.vertices.find((v) => v.id === m.b)!;
      return a.y === 0 && b.y === 0;
    });
    expect(abajo).toHaveLength(1);
    expect(abajo[0].virtual).toBeFalsy();
  });
});

describe("croquis: escaleras, giro y tipos", () => {
  const base = (extra: Partial<Escalera> = {}): Escalera => ({ id: "s1", x: 0, y: 0, ancho: 1.2, largo: 3, giro: 0, sentido: "sube", ...extra });

  it("el giro se normaliza y va de 15° en 15° salvo que sea libre", () => {
    expect(normalizarGiro(450)).toBe(90);
    expect(normalizarGiro(-90)).toBe(270);
    expect(normalizarGiro(360)).toBe(0);
    expect(giroConPaso(97, false)).toBe(90);
    expect(giroConPaso(98, false)).toBe(105);
    expect(giroConPaso(97.4, true)).toBe(97);
    expect(giroConPaso(359, false)).toBe(0);
    // 0 = arriba, sentido horario (y hacia abajo).
    expect(anguloHacia({ x: 0, y: 0 }, { x: 0, y: -1 })).toBeCloseTo(0, 9);
    expect(anguloHacia({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(90, 9);
    expect(anguloHacia({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(180, 9);
  });

  it("la manija queda frente al extremo de llegada y gira con la escalera", () => {
    const s = base({ x: 2, y: 2 });
    const h = manijaGiro(s, 0.5);
    expect(h.x).toBeCloseTo(2, 9);
    expect(h.y).toBeCloseTo(0, 9);
    // Arrastrar la manija a la derecha deja la escalera a 90°.
    expect(giroConPaso(anguloHacia(s, { x: 5, y: 2.1 }), false)).toBe(90);
    const g = { ...s, giro: 90 };
    const h2 = manijaGiro(g, 0.5);
    expect(h2.x).toBeCloseTo(4, 9);
    expect(h2.y).toBeCloseTo(2, 9);
    // El marco local también gira: el arranque (abajo) queda a la izquierda.
    const arranque = escaleraAMundo(g, { x: 0, y: 1.5 });
    expect(arranque.x).toBeCloseTo(0.5, 9);
    expect(arranque.y).toBeCloseTo(2, 9);
  });

  it("el giro, el tipo y las medidas se copian a la gemela; el sentido, invertido", () => {
    let c: Croquis = { niveles: [cuarto(), nivelVacio("Nivel 1", 3)] };
    const [pb, n1] = c.niveles;
    c = agregarEscalera(c, pb.id, { id: "esc1", x: 2, y: 2, giro: 0, sentido: "sube", nivelDestino: n1.id, ...escaleraInicial("u") });
    expect(c.niveles[0].escaleras[0].id).toBe("esc1");
    c = cambiarEscalera(c, pb.id, "esc1", { giro: 450 });
    c = cambiarEscalera(c, pb.id, "esc1", { espejo: true });
    c = cambiarEscalera(c, pb.id, "esc1", { tipo: "caracol", diametro: 1.8 });
    const [abajo, arriba] = [c.niveles[0].escaleras[0], c.niveles[1].escaleras[0]];
    expect(abajo.giro).toBe(90);
    expect(arriba.giro).toBe(90);
    expect(arriba.tipo).toBe("caracol");
    expect(arriba.diametro).toBe(1.8);
    expect(arriba.espejo).toBe(true);
    expect(arriba.sentido).toBe("baja");
    // Cambiar el nivel al que llega conserva el identificador (sigue seleccionada).
    const otro = nivelVacio("Nivel 2", 6);
    c = { niveles: [...c.niveles, otro] };
    c = cambiarEscalera(c, pb.id, "esc1", { nivelDestino: otro.id });
    expect(c.niveles[0].escaleras[0].id).toBe("esc1");
    expect(c.niveles[0].escaleras[0].tipo).toBe("caracol");
    expect(c.niveles[1].escaleras).toHaveLength(0);
    expect(c.niveles[2].escaleras).toHaveLength(1);
  });

  it("una escalera guardada sin tipo se dibuja recta y la flecha de sube apunta al frente", () => {
    const t = trazoEscalera(base());
    expect(t.contornos).toHaveLength(1);
    expect(t.lineas.length).toBeGreaterThan(5);
    expect(t.flecha[t.flecha.length - 1].y).toBeLessThan(t.flecha[0].y);
    const baja = trazoEscalera(base({ sentido: "baja" }));
    expect(baja.flecha[baja.flecha.length - 1].y).toBeGreaterThan(baja.flecha[0].y);
  });

  it("la escalera en L ocupa una L y el espejo la voltea", () => {
    const s = base({ ...escaleraInicial("l") });
    const t = trazoEscalera(s);
    const f = Math.min(s.ancho, s.largo) / 2;
    expect(Math.abs(areaConSigno(t.contornos[0]))).toBeCloseTo(s.ancho * s.largo - (s.ancho - f) * (s.largo - f), 9);
    // Sin espejo el primer tramo va a la izquierda; con espejo, a la derecha.
    expect(t.flecha[0].x).toBeLessThan(0);
    expect(trazoEscalera({ ...s, espejo: true }).flecha[0].x).toBeGreaterThan(0);
    expect(t.flecha).toHaveLength(3);
  });

  it("caracol, rampa y elevador tienen su propio dibujo", () => {
    const tc = trazoEscalera(base({ ...escaleraInicial("caracol"), diametro: 2 }));
    expect(tc.contornos[0].every((p) => Math.hypot(p.x, p.y) <= 1 + 1e-9)).toBe(true);
    expect(tc.lineas).toHaveLength(12);
    expect(tc.flecha.length).toBeGreaterThan(10);
    expect(tc.flecha.every((p) => Math.hypot(p.x, p.y) < 1)).toBe(true);
    const ramp = trazoEscalera(base({ ...escaleraInicial("rampa") }));
    expect(ramp.flecha).toHaveLength(2);
    expect(escaleraInicial("rampa").pendiente).toBe(8);
    const elev = trazoEscalera(base({ ...escaleraInicial("elevador") }));
    expect(elev.flecha).toHaveLength(0);
    expect(elev.lineas).toHaveLength(2);
  });
});
