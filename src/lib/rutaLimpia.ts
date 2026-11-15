// Limpia rutas que llegan con signos pegados al final.
// WhatsApp y otros chats suelen pegar al enlace el signo que lo sigue:
// "/diagnostico)", "/diagnostico.", "/diagnostico*" (negritas), comillas, etc.
// Ninguna página del sitio termina en algo que no sea letra, número o "/",
// así que todo lo demás al final de la ruta se quita.

// Signos sobrantes al final, con o sin "/" después: "/pagina)" y "/pagina)/"
const BASURA_FINAL = /[^\p{L}\p{N}/]+\/*$/u;

/** Devuelve la ruta sin signos sobrantes al final (o la misma si ya estaba limpia). */
export function rutaLimpia(pathname: string): string {
  let ruta = pathname;
  // El navegador codifica comillas, espacios y signos como » (%C2%BB)
  try { ruta = decodeURIComponent(pathname); } catch { /* codificación inválida: se usa tal cual */ }
  let limpia = ruta;
  // Puede venir encadenado: "/pagina)./"
  for (let i = 0; i < 5 && BASURA_FINAL.test(limpia); i++) limpia = limpia.replace(BASURA_FINAL, "");
  if (limpia === ruta) return pathname;
  return limpia || "/";
}
