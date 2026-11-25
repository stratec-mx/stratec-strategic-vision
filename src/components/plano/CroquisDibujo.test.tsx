import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  CLASES_ABERTURA, TIPOS_ESCALERA, agregarAbertura, agregarEscalera, agregarMuro, claseAbertura, escaleraInicial, nivelVacio,
  type Croquis, type Nivel, type P,
} from "@/lib/plano/croquis";
import { CroquisDibujo } from "./CroquisDibujo";
import { CroquisEditor } from "./CroquisEditor";

function cuarto(): Nivel {
  const pts: P[] = [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 10 }, { x: 0, y: 10 }];
  let n = nivelVacio("Planta baja");
  for (let i = 0; i < pts.length; i++) n = agregarMuro(n, pts[i], pts[(i + 1) % pts.length]);
  return n;
}

/** Un nivel con todas las variantes de puerta, una línea divisoria y todos los tipos de escalera. */
function nivelCompleto(): Nivel {
  let n = cuarto();
  n = agregarMuro(n, { x: 20, y: 0 }, { x: 20, y: 10 }, 0.15, true);
  const abajo = n.muros.filter((m) => {
    const a = n.vertices.find((v) => v.id === m.a)!;
    const b = n.vertices.find((v) => v.id === m.b)!;
    return a.y === 0 && b.y === 0;
  });
  CLASES_ABERTURA.forEach((c, i) => {
    n = agregarAbertura(n, abajo[i % abajo.length].id, 0.15 + 0.12 * Math.floor(i / abajo.length) * 2, c);
  });
  n = {
    ...n,
    escaleras: TIPOS_ESCALERA.map((t, i) => ({ id: `s${i}`, x: 3 + i * 5, y: 5, giro: i * 30, sentido: i % 2 ? "baja" : "sube", ...escaleraInicial(t) })),
  };
  return n;
}

describe("croquis: dibujo", () => {
  it("dibuja todas las variantes sin errores, con área de toque para cada puerta y ventana", () => {
    const n = nivelCompleto();
    expect(n.aberturas.map(claseAbertura).sort()).toEqual([...CLASES_ABERTURA].sort());
    const { container } = render(
      <svg>
        <CroquisDibujo nivel={n} nombresNivel={{}} seleccion={{ k: "escalera", id: "s0" }} esc={0.02} mostrarVertices />
      </svg>,
    );
    expect(container.querySelectorAll('[data-k="abertura"]')).toHaveLength(n.aberturas.length);
    // Las áreas de toque van después de las cotas para quedar encima.
    const piezas = [...container.querySelectorAll("[data-k]")];
    const ultimaCota = piezas.map((el) => el.tagName.toLowerCase()).lastIndexOf("text");
    const primerToque = piezas.findIndex((el) => el.getAttribute("data-k") === "abertura");
    expect(primerToque).toBeGreaterThan(ultimaCota);
    // Cada toque mide al menos 14 px (esc = 0.02 m por píxel).
    for (const el of container.querySelectorAll('[data-k="abertura"]')) expect(Number(el.getAttribute("stroke-width"))).toBeGreaterThanOrEqual(14 * 0.02);
    // La línea divisoria va punteada.
    expect(container.querySelector("line[stroke-dasharray]")).not.toBeNull();
    // La escalera seleccionada muestra su manija de giro.
    expect(container.querySelectorAll('[data-k="escalera-giro"]')).toHaveLength(1);
    expect(screen.getByText("Elevador")).toBeTruthy();
  });
});

describe("croquis: editor", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    // jsdom no trae PointerEvent: sin él, clientX llega vacío.
    class PointerEventFalso extends MouseEvent {
      pointerId: number;
      constructor(tipo: string, init: PointerEventInit = {}) {
        super(tipo, init);
        this.pointerId = init.pointerId ?? 1;
      }
    }
    vi.stubGlobal("PointerEvent", PointerEventFalso);
    Object.defineProperty(window, "PointerEvent", { value: PointerEventFalso, configurable: true });
    // Lienzo de 800 × 520 px.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, width: 800, height: 520, right: 800, bottom: 520, toJSON: () => ({}),
    } as DOMRect);
  });

  it("con la herramienta Puerta, tocar una ventana la selecciona y arrastrarla la desliza sin crear otra", () => {
    let n = cuarto();
    const abajo = n.muros.find((m) => {
      const a = n.vertices.find((v) => v.id === m.a)!;
      const b = n.vertices.find((v) => v.id === m.b)!;
      return a.y === 0 && b.y === 0;
    })!;
    n = agregarAbertura(n, abajo.id, 0.5, "ventana"); // en (20, 0)
    const inicial: Croquis = { niveles: [n] };
    const cambios: Croquis[] = [];
    const { container } = render(<CroquisEditor croquis={inicial} onChange={(c) => cambios.push(c)} />);
    fireEvent.click(screen.getByRole("button", { name: /Puerta/ }));
    const ventana = container.querySelector('[data-k="abertura"]')!;
    // Del mundo (m) a la pantalla (px), según la vista encuadrada en un lienzo de 800 px.
    const [vx, vy, vw] = container.querySelector("svg[role=application]")!.getAttribute("viewBox")!.split(" ").map(Number);
    const esc = vw / 800;
    const px = (p: P) => ({ clientX: (p.x - vx) / esc, clientY: (p.y - vy) / esc });
    fireEvent.pointerDown(ventana, { pointerId: 1, ...px({ x: 20, y: 0 }) });
    fireEvent.pointerUp(ventana, { pointerId: 1, ...px({ x: 20, y: 0 }) });
    // Solo se seleccionó: no hay puerta nueva.
    expect(cambios).toHaveLength(0);
    expect(screen.getByRole("region", { name: "Lo seleccionado" }).textContent).toContain("Ventana");

    // Arrastrarla 3 m a la derecha, aunque el dedo se desvíe un poco del muro.
    fireEvent.pointerDown(ventana, { pointerId: 2, ...px({ x: 20, y: 0 }) });
    fireEvent.pointerMove(ventana, { pointerId: 2, ...px({ x: 21.5, y: 0.2 }) });
    fireEvent.pointerMove(ventana, { pointerId: 2, ...px({ x: 23, y: 0.3 }) });
    fireEvent.pointerUp(ventana, { pointerId: 2, ...px({ x: 23, y: 0.3 }) });
    const ultimo = cambios[cambios.length - 1].niveles[0];
    expect(ultimo.aberturas).toHaveLength(1);
    const muro = ultimo.muros.find((m) => m.id === ultimo.aberturas[0].muro)!;
    const a = ultimo.vertices.find((v) => v.id === muro.a)!;
    const b = ultimo.vertices.find((v) => v.id === muro.b)!;
    const x = a.x + (b.x - a.x) * ultimo.aberturas[0].t;
    expect(x).toBeCloseTo(23, 1);
    expect(a.y).toBe(0);
    // Todo el arrastre es un solo paso de deshacer.
    fireEvent.click(screen.getByRole("button", { name: "Deshacer (Ctrl+Z)" }));
    expect(cambios[cambios.length - 1].niveles[0].aberturas[0].t).toBe(n.aberturas[0].t);
  });

  it("la manija gira la escalera de 15° en 15° y el giro llega a la gemela del otro nivel", () => {
    let c: Croquis = { niveles: [cuarto(), nivelVacio("Nivel 1", 3)] };
    c = agregarEscalera(c, c.niveles[0].id, { id: "e1", x: 10, y: 5, giro: 0, sentido: "sube", nivelDestino: c.niveles[1].id, ...escaleraInicial("recta") });
    const cambios: Croquis[] = [];
    const { container } = render(<CroquisEditor croquis={c} onChange={(x) => cambios.push(x)} />);
    const [vx, vy, vw] = container.querySelector("svg[role=application]")!.getAttribute("viewBox")!.split(" ").map(Number);
    const esc = vw / 800;
    const px = (p: P) => ({ clientX: (p.x - vx) / esc, clientY: (p.y - vy) / esc });
    // Con una herramienta que no dibuja tramos (aquí, Ventana), tocar la escalera la selecciona.
    fireEvent.click(screen.getByRole("button", { name: /Ventana/ }));
    const escalera = container.querySelector('[data-k="escalera"]')!;
    fireEvent.pointerDown(escalera, { pointerId: 1, ...px({ x: 10, y: 5 }) });
    fireEvent.pointerUp(escalera, { pointerId: 1, ...px({ x: 10, y: 5 }) });
    expect(cambios).toHaveLength(0);
    const manija = container.querySelector('[data-k="escalera-giro"]')!;
    expect(manija).not.toBeNull();
    fireEvent.pointerDown(manija, { pointerId: 2, ...px({ x: 10, y: 3 }) });
    fireEvent.pointerMove(manija, { pointerId: 2, ...px({ x: 12, y: 4.8 }) }); // ~84° → 90°
    fireEvent.pointerMove(manija, { pointerId: 2, ...px({ x: 13, y: 5.1 }) });
    fireEvent.pointerUp(manija, { pointerId: 2, ...px({ x: 13, y: 5.1 }) });
    const ultimo = cambios[cambios.length - 1];
    expect(ultimo.niveles[0].escaleras[0].giro).toBe(90);
    expect(ultimo.niveles[1].escaleras[0].giro).toBe(90);
    fireEvent.click(screen.getByRole("button", { name: "Deshacer (Ctrl+Z)" }));
    expect(cambios[cambios.length - 1].niveles[0].escaleras[0].giro).toBe(0);
  });
});
