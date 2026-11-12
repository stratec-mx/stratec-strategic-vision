import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoopVideo } from "./LoopVideo";

// jsdom no trae IntersectionObserver ni reproduce video: se simulan aquí.
type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;
let observers: Array<{ callback: Callback; rootMargin?: string }> = [];

const intersect = (isIntersecting: boolean) =>
  act(() => {
    observers.forEach((o) => o.callback([{ isIntersecting }]));
  });

const setMedia = (matching: string[]) => {
  window.matchMedia = ((query: string) => ({
    matches: matching.some((m) => query.includes(m)),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
};

const setSaveData = (saveData: boolean | undefined) => {
  Object.defineProperty(navigator, "connection", { configurable: true, value: saveData === undefined ? undefined : { saveData } });
};

const play = vi.fn(() => Promise.resolve());
const pause = vi.fn();

beforeEach(() => {
  observers = [];
  play.mockClear();
  pause.mockClear();
  setMedia([]);
  setSaveData(undefined);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: Callback, options?: { rootMargin?: string }) {
        observers.push({ callback, rootMargin: options?.rootMargin });
      }
      observe() {}
      disconnect() {}
    },
  );
  HTMLMediaElement.prototype.play = play;
  HTMLMediaElement.prototype.pause = pause;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const props = { poster: "/videos/home-poster.jpg", webm: "/videos/home.webm", mp4: "/videos/home.mp4" };
const video = (c: HTMLElement) => c.querySelector("video");
const sources = (c: HTMLElement) => Array.from(c.querySelectorAll("source")).map((s) => [s.getAttribute("src"), s.getAttribute("type")]);

describe("LoopVideo", () => {
  it("pinta el póster y reserva la proporción antes de pedir el video", () => {
    const { container } = render(<LoopVideo {...props} />);
    expect(container.querySelector("img")).toHaveAttribute("src", props.poster);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect((container.firstChild as HTMLElement).style.aspectRatio).toBe("16 / 9");
    expect(video(container)).toBeNull();
  });

  it("pide el video al acercarse a la pantalla: WebM primero, MP4 de respaldo", async () => {
    const { container } = render(<LoopVideo {...props} />);
    await intersect(true);
    const el = video(container)!;
    expect(sources(container)).toEqual([
      [props.webm, "video/webm"],
      [props.mp4, "video/mp4"],
    ]);
    expect(el.muted).toBe(true);
    expect(el.loop).toBe(true);
    expect(el.autoplay).toBe(true);
    expect(el.controls).toBe(false);
    expect(el).toHaveAttribute("playsinline");
    expect(el).toHaveAttribute("preload", "none");
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveAttribute("tabindex", "-1");
    expect(play).toHaveBeenCalled();
  });

  it("espera a que la página termine de cargar", async () => {
    const readyState = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const { container } = render(<LoopVideo {...props} />);
    await intersect(true);
    expect(video(container)).toBeNull();
    await act(() => {
      window.dispatchEvent(new Event("load"));
    });
    expect(video(container)).not.toBeNull();
    readyState.mockRestore();
  });

  it("pausa al salir de pantalla y reanuda al volver", async () => {
    render(<LoopVideo {...props} />);
    await intersect(true);
    play.mockClear();
    await intersect(false);
    expect(pause).toHaveBeenCalled();
    await intersect(true);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("usa la versión ligera en pantallas angostas", async () => {
    setMedia(["max-width: 767px"]);
    const { container } = render(<LoopVideo {...props} mobileWebm="/videos/home-movil.webm" mobileMp4="/videos/home-movil.mp4" />);
    await intersect(true);
    expect(sources(container).map(([src]) => src)).toEqual(["/videos/home-movil.webm", "/videos/home-movil.mp4"]);
  });

  it("no pide el video si el visitante prefiere menos movimiento", async () => {
    setMedia(["prefers-reduced-motion"]);
    const { container } = render(<LoopVideo {...props} />);
    await intersect(true);
    expect(video(container)).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("no pide el video con ahorro de datos activado", async () => {
    setSaveData(true);
    const { container } = render(<LoopVideo {...props} />);
    await intersect(true);
    expect(video(container)).toBeNull();
  });

  it("si el video falla, se queda solo el póster", async () => {
    const { container } = render(<LoopVideo {...props} />);
    await intersect(true);
    const all = container.querySelectorAll("source");
    await act(() => {
      all[all.length - 1].dispatchEvent(new Event("error"));
    });
    expect(video(container)).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("el contenido va encima y la capa oscura es opcional", () => {
    const { container, getByText, rerender } = render(<LoopVideo {...props}><h1>Título</h1></LoopVideo>);
    expect(getByText("Título")).toBeInTheDocument();
    const layer = container.querySelector('[aria-hidden="true"]')!;
    expect(layer.contains(getByText("Título"))).toBe(false);
    expect(layer.querySelectorAll("div")).toHaveLength(0);
    rerender(<LoopVideo {...props} overlay><h1>Título</h1></LoopVideo>);
    expect((layer.querySelector("div") as HTMLElement).style.opacity).toBe("0.55");
  });
});
