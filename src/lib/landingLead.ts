// Envío del formulario corto de las landings a la función submit-lead, la misma
// que usa el formulario de contacto: guarda el lead en el panel, avisa por
// Telegram y manda el correo interno de EmailJS (correo: true).
import type { LandingData } from "@/data/landings";
import { utmLines, type Utm } from "@/lib/utm";

/**
 * La landing no pide correo y submit-lead exige uno con formato válido. Se manda
 * esta dirección para que el lead entre; submit-lead la reconoce y no envía la
 * confirmación al cliente ni muestra el botón de responder por correo.
 */
export const SIN_CORREO = "sin-correo@stratecsecurity.com";

export interface LandingLeadForm {
  nombre: string;
  empresa: string;
  telefono: string;
  /** Campo trampa: las personas no lo ven; si trae algo, es un robot. */
  honeypot?: string;
}

/** Solo dígitos; acepta +52, espacios, guiones y paréntesis. */
export const digitosTelefono = (tel: string) => tel.replace(/\D/g, "");

/** 10 dígitos de México, o 12-13 con lada internacional. */
export const telefonoValido = (tel: string) => {
  const d = digitosTelefono(tel);
  return d.length === 10 || (d.length >= 12 && d.length <= 13);
};

export type Errores = Partial<Record<"nombre" | "empresa" | "telefono", string>>;

/** Errores del formulario corto; vacío si se puede enviar. */
export function validarLanding(f: LandingLeadForm): Errores {
  const e: Errores = {};
  if (f.nombre.trim().length < 2) e.nombre = "Escribe tu nombre";
  if (f.empresa.trim().length < 2) e.empresa = "Escribe el nombre de tu empresa";
  if (!telefonoValido(f.telefono)) e.telefono = "Escribe un teléfono de 10 dígitos";
  return e;
}

/** Cuerpo que recibe submit-lead. El origen y los UTM van en la nota del lead. */
export function buildLandingLead(landing: LandingData, form: LandingLeadForm, utm: Utm) {
  const nota = [`Origen: ${landing.origen}`, `Página: stratecsecurity.com${landing.ruta}`, ...utmLines(utm)].join("\n");
  return {
    name: form.nombre.trim(),
    email: SIN_CORREO,
    organization: form.empresa.trim(),
    telefono: form.telefono.trim(),
    servicio: landing.servicio,
    message: nota,
    mensaje: nota,
    honeypot: form.honeypot ?? "",
    origen: landing.origen,
    utm,
    correo: true,
  };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Devuelve true si el lead quedó guardado. */
export async function submitLandingLead(body: ReturnType<typeof buildLandingLead>, fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const r = await fetcher(`${SUPABASE_URL}/functions/v1/submit-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch {
    return false;
  }
}
