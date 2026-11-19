// Buscador del panel (Ctrl+K): clientes, prospectos, cotizaciones y documentos,
// solo en lo que el rol del usuario puede ver. La base de datos vuelve a aplicar los permisos.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { aResultado, filtroOr, limpiarBusqueda, objetivosPermitidos, type Resultado } from "@/lib/panelSearch";
import { MODULOS } from "./panelNav";

export const BuscadorPanel = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => { if (!open) { setTexto(""); setResultados([]); } }, [open]);

  useEffect(() => {
    const limpio = limpiarBusqueda(texto);
    if (!limpio) { setResultados([]); setBuscando(false); return; }
    let vigente = true;
    setBuscando(true);
    const t = setTimeout(async () => {
      const objetivos = objetivosPermitidos(can);
      const respuestas = await Promise.all(
        objetivos.map((o) => supabase.from(o.tabla).select(o.columnas).or(filtroOr(o, limpio)).limit(6)),
      );
      if (!vigente) return;
      setResultados(respuestas.flatMap((r, i) => ((r.data ?? []) as unknown as Record<string, unknown>[]).map((f) => aResultado(objetivos[i].grupo, f))));
      setBuscando(false);
    }, 250);
    return () => { vigente = false; clearTimeout(t); };
  }, [texto, can]);

  const ir = (href: string) => { onOpenChange(false); navigate(href); };
  const modulos = MODULOS.filter((m) => !m.resource || can(m.resource))
    .filter((m) => !texto.trim() || m.label.toLowerCase().includes(texto.trim().toLowerCase()));
  const grupos = objetivosPermitidos(can)
    .map((o) => ({ ...o, filas: resultados.filter((r) => r.grupo === o.grupo) }))
    .filter((g) => g.filas.length);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <DialogTitle className="sr-only">Buscar en el panel</DialogTitle>
      {/* El filtrado lo hace la base de datos; cmdk solo muestra. */}
      <CommandInput placeholder="Buscar cliente, prospecto, cotización o folio" value={texto} onValueChange={setTexto} />
      <CommandList className="max-h-[60vh]">
        {buscando && (
          <div className="flex items-center gap-2 px-4 py-3 text-[13px] text-pn-sub"><Loader2 className="h-4 w-4 animate-spin" /> Buscando…</div>
        )}
        {!buscando && <CommandEmpty>{limpiarBusqueda(texto) ? "Sin coincidencias." : "Escribe al menos 2 letras."}</CommandEmpty>}
        {grupos.map((g) => (
          <CommandGroup key={g.grupo} heading={g.etiqueta}>
            {g.filas.map((r) => (
              <CommandItem key={`${r.grupo}:${r.id}`} value={`${r.grupo}:${r.id}`} onSelect={() => ir(r.href)}>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[13px] font-medium text-pn-texto">{r.titulo}</span>
                  <span className="truncate text-xs text-pn-sub tnum">{r.detalle}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {modulos.length > 0 && (
          <CommandGroup heading="Ir a">
            {modulos.map((m) => (
              <CommandItem key={m.to} value={`ir:${m.to}`} onSelect={() => ir(m.to)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={m.d} /></svg>
                <span className="text-[13px]">{m.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};
