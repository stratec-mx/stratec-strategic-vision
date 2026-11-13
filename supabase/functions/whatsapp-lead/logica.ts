// Lógica pura de whatsapp-lead (sin Deno ni red) para poder probarla aparte.

/** Lo que manda el bot de WhatsApp cuando detecta un prospecto. */
export interface LeadWhatsApp {
  motivo?: string;
  nombre?: string;
  empresa?: string;
  ciudad?: string;
  necesidad?: string;
  urgencia?: string;
  resumen?: string;
  telefono?: string;
  conversation_id?: string;
}

/** Marca en las notas que identifica a los leads del bot (también sirve para buscarlos). */
export const MARCA = "[whatsapp]";

// deno-lint-ignore no-control-regex
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]+/g;
const txt = (v: unknown, max: number) => String(v ?? "").replace(CONTROL, " ").replace(/ {2,}/g, " ").trim().substring(0, max);

/** Teléfono E.164 sin "+": solo dígitos, 11 a 15. */
export function telefonoValido(v: unknown): string | null {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length >= 11 && d.length <= 15 ? d : null;
}

/** ID de conversación de Zernio: solo caracteres seguros, porque se usa dentro de un filtro. */
export function conversacionValida(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return /^[A-Za-z0-9_.:-]{3,120}$/.test(s) ? s : null;
}

export type Validado = { ok: true; lead: Required<LeadWhatsApp> } | { ok: false; error: string };

export function validar(body: unknown): Validado {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "JSON inválido" };
  const b = body as Record<string, unknown>;
  const telefono = telefonoValido(b.telefono) ?? "";
  const conversation_id = conversacionValida(b.conversation_id) ?? "";
  if (!telefono && !conversation_id) return { ok: false, error: "Falta telefono o conversation_id válido" };
  return {
    ok: true,
    lead: {
      motivo: txt(b.motivo, 40),
      nombre: txt(b.nombre, 100),
      empresa: txt(b.empresa, 150),
      ciudad: txt(b.ciudad, 100),
      necesidad: txt(b.necesidad, 300),
      urgencia: txt(b.urgencia, 60),
      resumen: txt(b.resumen, 1200),
      telefono,
      conversation_id,
    },
  };
}

const MOTIVO: Record<string, string> = {
  interes_compra: "Interés de compra",
  cita_solicitada: "Pidió cita",
  pide_persona: "Pidió hablar con una persona",
  escalamiento: "Escalamiento",
};

/** Bloque que se agrega a las notas en cada aviso del bot. */
export function bloqueNotas(l: Required<LeadWhatsApp>, hora: string): string {
  return [
    `${MARCA} ${hora} · ${MOTIVO[l.motivo] ?? (l.motivo || "Aviso del bot")}`,
    l.ciudad && `Ciudad: ${l.ciudad}`,
    l.necesidad && `Necesidad: ${l.necesidad}`,
    l.urgencia && `Urgencia: ${l.urgencia}`,
    l.resumen && `Resumen: ${l.resumen}`,
    l.conversation_id && `Conversación: ${l.conversation_id}`,
  ].filter(Boolean).join("\n");
}

/** Aviso más reciente arriba, historial abajo, sin pasar de 8000 caracteres. */
export function unirNotas(previas: string | null | undefined, bloque: string): string {
  const p = String(previas ?? "").trim();
  return (p ? `${bloque}\n\n${p}` : bloque).substring(0, 8000);
}

/** Compara dos secretos en tiempo constante (sobre sus SHA-256). */
export async function iguales(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0 && a.length > 0 && b.length > 0;
}
