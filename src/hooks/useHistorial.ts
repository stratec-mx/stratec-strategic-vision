import { useCallback, useEffect, useRef, useState } from "react";

interface Estado<T> {
  pasado: T[];
  presente: T;
  futuro: T[];
}

const LIMITE = 150;

/**
 * Historial para deshacer y rehacer. `aplicar` agrega un paso; con `fusionar: true`
 * reemplaza el paso actual (útil mientras se arrastra algo: todo el arrastre es un solo paso).
 * `onCambio` se llama con cada valor nuevo (no con el inicial).
 */
export function useHistorial<T>(inicial: T, onCambio?: (valor: T) => void) {
  const [h, setH] = useState<Estado<T>>({ pasado: [], presente: inicial, futuro: [] });
  const primero = useRef(true);
  const cb = useRef(onCambio);
  cb.current = onCambio;

  useEffect(() => {
    if (primero.current) {
      primero.current = false;
      return;
    }
    cb.current?.(h.presente);
  }, [h.presente]);

  const aplicar = useCallback((f: (actual: T) => T, opciones?: { fusionar?: boolean }) => {
    setH((e) => {
      const siguiente = f(e.presente);
      if (siguiente === e.presente) return e;
      if (opciones?.fusionar) return { ...e, presente: siguiente };
      return { pasado: [...e.pasado, e.presente].slice(-LIMITE), presente: siguiente, futuro: [] };
    });
  }, []);

  const deshacer = useCallback(() => {
    setH((e) => (e.pasado.length ? { pasado: e.pasado.slice(0, -1), presente: e.pasado[e.pasado.length - 1], futuro: [e.presente, ...e.futuro] } : e));
  }, []);

  const rehacer = useCallback(() => {
    setH((e) => (e.futuro.length ? { pasado: [...e.pasado, e.presente], presente: e.futuro[0], futuro: e.futuro.slice(1) } : e));
  }, []);

  return {
    valor: h.presente,
    aplicar,
    deshacer,
    rehacer,
    puedeDeshacer: h.pasado.length > 0,
    puedeRehacer: h.futuro.length > 0,
  };
}
