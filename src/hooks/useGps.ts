import { useCallback, useEffect, useState } from "react";

export interface PosicionGps {
  lng: number;
  lat: number;
  /** Precisión que reporta el equipo, en metros. */
  precision: number;
  fecha: string;
}

const mensaje = (e: GeolocationPositionError) =>
  e.code === e.PERMISSION_DENIED
    ? "El navegador no tiene permiso para usar la ubicación. Actívalo en la configuración del sitio."
    : e.code === e.TIMEOUT
      ? "El GPS tardó demasiado. Intenta al aire libre."
      : "No se pudo obtener la ubicación.";

const aPosicion = (p: GeolocationPosition): PosicionGps => ({
  lng: p.coords.longitude,
  lat: p.coords.latitude,
  precision: Math.round(p.coords.accuracy * 10) / 10,
  fecha: new Date(p.timestamp).toISOString(),
});

/** Sigue la posición del equipo mientras `seguir` sea verdadero; `pedirUna` toma una sola lectura. */
export function useGps(seguir: boolean) {
  const [pos, setPos] = useState<PosicionGps | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!seguir) return;
    if (!("geolocation" in navigator)) {
      setError("Este equipo o navegador no permite usar el GPS.");
      return;
    }
    setBuscando(true);
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPos(aPosicion(p));
        setError(null);
        setBuscando(false);
      },
      (e) => {
        setError(mensaje(e));
        setBuscando(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [seguir]);

  const pedirUna = useCallback(
    () =>
      new Promise<PosicionGps>((resolver, rechazar) => {
        if (!("geolocation" in navigator)) {
          rechazar(new Error("Este equipo o navegador no permite usar el GPS."));
          return;
        }
        setBuscando(true);
        navigator.geolocation.getCurrentPosition(
          (p) => {
            const r = aPosicion(p);
            setPos(r);
            setBuscando(false);
            resolver(r);
          },
          (e) => {
            setBuscando(false);
            setError(mensaje(e));
            rechazar(new Error(mensaje(e)));
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
        );
      }),
    [],
  );

  return { pos, error, buscando, pedirUna };
}
