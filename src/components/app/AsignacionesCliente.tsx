// Personas asignadas a un cliente (client_assignments, script 10). Solo el Administrador.
// La tabla no admite escritura directa: se usan mdesr_assign_client y mdesr_unassign_client,
// que piden un motivo y guardan el historial (la baja no borra la fila).
import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { describeDbError } from "@/lib/dbErrors";
import {
  PAPELES, etiquetaPapel, faltaTabla, motivoValido, nombreResponsable, papelSugerido, type Usuario,
} from "@/lib/responsables";

type Asignacion = { id: string; user_id: string; assignment_role: string; is_primary: boolean; assigned_at: string; reason: string };

// Tabla y funciones del script 10; aún no están en los tipos generados.
const sb = supabase as unknown as SupabaseClient;
const tabla = () => sb.from("client_assignments");
const rpc = (fn: string, args: Record<string, unknown>) => sb.rpc(fn, args);

/** ¿Ya existe client_assignments en esta base? */
export function useHayAsignaciones(activo: boolean) {
  const [hay, setHay] = useState(false);
  useEffect(() => {
    if (!activo) return;
    tabla().select("id").limit(1).then(({ error }) => {
      if (error && !faltaTabla(error)) console.warn("[Asignaciones] No se pudo leer client_assignments:", error.code);
      setHay(!error);
    });
  }, [activo]);
  return hay;
}

export const AsignacionesCliente = ({
  cliente, usuarios, onClose,
}: {
  cliente: { id: string; name: string; owner_id?: string | null } | null;
  usuarios: Usuario[];
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const [filas, setFilas] = useState<Asignacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [papel, setPapel] = useState("asesor");
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    if (!cliente) return;
    setCargando(true);
    const { data, error } = await tabla()
      .select("id, user_id, assignment_role, is_primary, assigned_at, reason")
      .eq("client_id", cliente.id)
      .is("removed_at", null)
      .order("assigned_at", { ascending: true });
    setCargando(false);
    if (error) { toast({ title: "No se pudieron leer las asignaciones", description: describeDbError(error, "Intenta de nuevo."), variant: "destructive" }); return; }
    setFilas((data ?? []) as unknown as Asignacion[]);
  }, [cliente, toast]);

  useEffect(() => { setUsuario(""); setMotivo(""); setFilas([]); cargar(); }, [cargar]);

  const elegirUsuario = (id: string) => { setUsuario(id); setPapel(papelSugerido(usuarios.find((u) => u.id === id))); };

  const agregar = async () => {
    if (!cliente || !usuario) return;
    if (!motivoValido(motivo)) { toast({ title: "Escribe el motivo", description: "Al menos 5 letras; queda en el historial.", variant: "destructive" }); return; }
    setOcupado(true);
    const { error } = await rpc("mdesr_assign_client", { _client: cliente.id, _user: usuario, _role: papel, _reason: motivo.trim(), _primary: false });
    setOcupado(false);
    if (error) {
      toast({
        title: "No se pudo asignar",
        description: error.code === "23505" ? "Esa persona ya está asignada con ese papel." : describeDbError(error, "Intenta de nuevo."),
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Persona asignada", description: nombreResponsable(usuario, usuarios) });
    setUsuario(""); setMotivo("");
    cargar();
  };

  const quitar = async (a: Asignacion) => {
    if (!cliente) return;
    const razon = window.prompt(`Motivo para retirar a ${nombreResponsable(a.user_id, usuarios)} de ${cliente.name} (queda en el historial):`);
    if (razon === null) return;
    if (!motivoValido(razon)) { toast({ title: "Escribe el motivo", description: "Al menos 5 letras.", variant: "destructive" }); return; }
    setOcupado(true);
    const { error } = await rpc("mdesr_unassign_client", { _client: cliente.id, _user: a.user_id, _role: a.assignment_role, _reason: razon.trim() });
    setOcupado(false);
    if (error) { toast({ title: "No se pudo retirar", description: describeDbError(error, "Intenta de nuevo."), variant: "destructive" }); return; }
    toast({ title: "Asignación retirada" });
    cargar();
  };

  return (
    <Sheet open={!!cliente} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl text-navy font-light">Personas asignadas</SheetTitle>
          <SheetDescription>
            {cliente?.name}. Responsable: {nombreResponsable(cliente?.owner_id, usuarios)}. Las personas con perfil limitado
            (Asesor, Operaciones, Ejecutivo, Solo lectura) solo ven los clientes donde son responsables o están asignadas aquí.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 border border-border">
          {cargando && <div className="flex items-center gap-2 p-4 text-sm text-steel"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>}
          {!cargando && filas.length === 0 && <p className="p-4 text-sm text-steel">Nadie asignado además del responsable.</p>}
          {!cargando && filas.length > 0 && (
            <ul className="divide-y divide-border">
              {filas.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="text-sm text-navy">{nombreResponsable(a.user_id, usuarios)}{a.is_primary && " · principal"}</div>
                    <div className="text-xs text-steel">{etiquetaPapel(a.assignment_role)} · {a.reason}</div>
                  </div>
                  <Button
                    type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 rounded-none"
                    onClick={() => quitar(a)} disabled={ocupado}
                    aria-label={`Retirar a ${nombreResponsable(a.user_id, usuarios)}`} title="Retirar asignación"
                  >
                    <X className="h-4 w-4 text-steel" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-navy">Agregar persona</h3>
          <div className="space-y-2">
            <Label className="text-xs text-steel">Persona</Label>
            <Select value={usuario} onValueChange={elegirUsuario}>
              <SelectTrigger className="rounded-none h-10 border-border"><SelectValue placeholder="Elige a alguien" /></SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-steel">Papel</Label>
            <Select value={papel} onValueChange={setPapel}>
              <SelectTrigger className="rounded-none h-10 border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAPELES.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-steel" htmlFor="motivo-asignacion">Motivo</Label>
            <Input id="motivo-asignacion" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300}
              placeholder="Ej. Lleva la cuenta desde la primera visita" className="rounded-none h-10 border-border" />
          </div>
          <Button type="button" onClick={agregar} disabled={!usuario || ocupado} className="w-full rounded-none bg-navy hover:bg-navy-deep text-smoke h-10">
            {ocupado ? "Guardando…" : "Asignar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
