// Correo y teléfono de leads y clientes no se pueden leer directamente de las
// tablas (privilegios por columna). Se obtienen de las vistas lead_contacts y
// client_contacts, que solo devuelven filas a quien tiene permiso "contactos".
import { supabase } from "@/integrations/supabase/client";

type WithId = { id: string };

export async function withLeadContacts<T extends WithId>(rows: T[]): Promise<(T & { email: string | null; phone: string | null })[]> {
  if (!rows.length) return [];
  const { data } = await supabase.from("lead_contacts").select("id, email, phone").in("id", rows.map((r) => r.id));
  const byId = new Map<string, { email: string | null; phone: string | null }>((data ?? []).map((c: any) => [c.id, c]));
  return rows.map((r) => ({ ...r, email: byId.get(r.id)?.email ?? null, phone: byId.get(r.id)?.phone ?? null }));
}

export async function withClientContacts<T extends WithId>(
  rows: T[],
): Promise<(T & { contact_email: string | null; contact_phone: string | null })[]> {
  if (!rows.length) return [];
  const { data } = await supabase.from("client_contacts").select("id, contact_email, contact_phone").in("id", rows.map((r) => r.id));
  const byId = new Map<string, { contact_email: string | null; contact_phone: string | null }>((data ?? []).map((c: any) => [c.id, c]));
  return rows.map((r) => ({ ...r, contact_email: byId.get(r.id)?.contact_email ?? null, contact_phone: byId.get(r.id)?.contact_phone ?? null }));
}
