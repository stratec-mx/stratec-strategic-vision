// Parámetros UTM de las campañas (redes, anuncios, mensajes directos).
// Se leen de la URL al llegar a una landing y se guardan en sessionStorage para
// que sigan disponibles si el visitante abre el aviso de privacidad y regresa.
// Viajan en la nota del lead para saber qué publicación trajo a cada prospecto.

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

const STORAGE_KEY = "stratec_utm";

/** Lee los UTM de una cadena de búsqueda ("?utm_source=fb&..."). Ignora vacíos y recorta valores largos. */
export function readUtm(search: string): Utm {
  const params = new URLSearchParams(search);
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const v = params.get(key)?.trim();
    if (v) utm[key] = v.substring(0, 100);
  }
  return utm;
}

const hasAny = (utm: Utm) => UTM_KEYS.some((k) => utm[k]);

/**
 * UTM de la visita: los de la URL si trae alguno (una campaña nueva reemplaza
 * a la anterior) y, si no, los guardados en esta sesión del navegador.
 */
export function captureUtm(search: string): Utm {
  const fromUrl = readUtm(search);
  if (hasAny(fromUrl)) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      /* navegación privada o almacenamiento bloqueado: basta con la URL */
    }
    return fromUrl;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const saved = JSON.parse(raw) as Record<string, unknown>;
    const utm: Utm = {};
    for (const key of UTM_KEYS) {
      if (typeof saved[key] === "string" && saved[key]) utm[key] = (saved[key] as string).substring(0, 100);
    }
    return utm;
  } catch {
    return {};
  }
}

/** Líneas para la nota del lead. Sin UTM, lo dice: así se distingue el tráfico directo. */
export function utmLines(utm: Utm): string[] {
  const lines = UTM_KEYS.filter((k) => utm[k]).map((k) => `${k}: ${utm[k]}`);
  return lines.length ? lines : ["Sin UTM (visita directa o enlace sin etiquetar)"];
}
