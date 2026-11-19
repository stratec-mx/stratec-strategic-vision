// Contadores del menú y avisos de la campana, calculados de los datos (sin tablas nuevas).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calcularAvisos, sinRespuesta, type Aviso } from "@/lib/panelGeneral";

const CLAVE_VISTOS = "stratec-panel-avisos-vistos";
const leerVistos = (): string[] => {
  try { return JSON.parse(localStorage.getItem(CLAVE_VISTOS) ?? "[]"); } catch { return []; }
};

export type Contadores = { leadsNuevos: number; cotizacionesSinRespuesta: number };

export function usePanelAvisos(refrescarCon: unknown) {
  const { can, session } = useAuth();
  const [contadores, setContadores] = useState<Contadores>({ leadsNuevos: 0, cotizacionesSinRespuesta: 0 });
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [vistos, setVistos] = useState<string[]>(leerVistos);
  const verLeads = can("leads");
  const verCotizaciones = can("quotes");
  const verAgenda = can("agenda");

  const cargar = useCallback(async () => {
    if (!session) return;
    const ahora = Date.now();
    const vacio = Promise.resolve({ data: null, count: null });
    const [leads, cotizaciones, citas] = await Promise.all([
      verLeads
        ? supabase.from("leads").select("id, full_name, organization, created_at", { count: "exact" }).eq("status", "new").order("created_at", { ascending: false }).limit(20)
        : vacio,
      verCotizaciones ? supabase.from("quotes").select("id, number, status, updated_at").eq("status", "sent") : vacio,
      verAgenda
        ? supabase.from("appointments").select("id, title, starts_at")
          .gte("starts_at", new Date(ahora - 36 * 3_600_000).toISOString())
          .lte("starts_at", new Date(ahora + 36 * 3_600_000).toISOString())
        : vacio,
    ]);
    const now = new Date();
    const cot = (cotizaciones.data ?? []) as { id: string; number: string; status: string; updated_at: string }[];
    setContadores({
      leadsNuevos: leads.count ?? (leads.data ?? []).length,
      cotizacionesSinRespuesta: cot.filter((q) => sinRespuesta(q, now)).length,
    });
    setAvisos(calcularAvisos({
      leadsNuevos: (leads.data ?? []) as { id: string; full_name: string; organization: string | null; created_at: string }[],
      cotizaciones: cot,
      citas: (citas.data ?? []) as { id: string; title: string; starts_at: string }[],
    }, now));
  }, [session, verLeads, verCotizaciones, verAgenda]);

  useEffect(() => { cargar(); }, [cargar, refrescarCon]);
  useEffect(() => {
    const t = setInterval(cargar, 120_000);
    return () => clearInterval(t);
  }, [cargar]);

  const sinLeer = avisos.filter((a) => !vistos.includes(a.id)).length;
  const marcarVistos = useCallback(() => {
    const ids = avisos.map((a) => a.id);
    setVistos(ids);
    try { localStorage.setItem(CLAVE_VISTOS, JSON.stringify(ids)); } catch { /* sin almacenamiento: solo dura esta visita */ }
  }, [avisos]);

  return { contadores, avisos, vistos, sinLeer, marcarVistos };
}
