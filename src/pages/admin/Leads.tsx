import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";

// Estados visibles en español, mapeados al enum existente `lead_status`
const ESTADOS: { value: "new" | "contacted" | "qualified" | "converted"; label: string }[] = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Calificado" },
  { value: "converted", label: "Cerrado" },
];

type Lead = {
  id: string;
  created_at: string;
  full_name: string;
  email: string | null;
  organization: string | null;
  role_title: string | null;
  status: string;
};

const AdminLeads = () => {
  const { session, loading, user, signOut } = useAuth();
  const [rows, setRows] = useState<Lead[]>([]);
  const [busy, setBusy] = useState(true);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id, created_at, full_name, email, organization, role_title, status")
      .order("created_at", { ascending: false });
    if (error) console.error("[AdminLeads.load]", error?.code ?? "error");
    setRows((data as Lead[]) ?? []);
    setBusy(false);
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-steel text-sm">Cargando…</div>;
  if (!session) return <Navigate to="/auth" replace />;

  const updateStatus = async (id: string, status: string) => {
    const allowed = ESTADOS.map((e) => e.value);
    if (!allowed.includes(status as any)) return;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase.from("leads").update({ status: status as any }).eq("id", id);
    if (error) {
      console.error("[AdminLeads.update]", error?.code ?? "error");
      load();
    }
  };

  return (
    <div className="min-h-screen bg-smoke">
      <header className="h-20 border-b border-border bg-card flex items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-6">
          <Logo size="sm" variant="dark" />
          <div className="hidden md:block">
            <div className="text-[10px] uppercase tracking-[0.3em] text-olive">Administración</div>
            <div className="font-display text-lg text-navy">Leads — Solicitudes web</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <div className="text-[10px] uppercase tracking-wider text-steel">Sesión</div>
            <div className="text-sm text-navy font-medium">{user?.email}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-steel hover:text-navy">
            <LogOut className="h-4 w-4 mr-2" /> Salir
          </Button>
        </div>
      </header>

      <main className="p-6 lg:p-10">
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.3em] text-olive">— Bandeja institucional</div>
          <h1 className="mt-2 font-display text-3xl text-navy font-light">
            {rows.length} {rows.length === 1 ? "solicitud registrada" : "solicitudes registradas"}
          </h1>
          <p className="mt-2 text-sm text-steel">
            Solicitudes enviadas desde el formulario público de STRATEC. Cambie el estado para gestionar el ciclo comercial.
          </p>
        </div>

        <div className="border border-border bg-card shadow-[var(--shadow-card)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 border-b border-border">
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-steel">
                <th className="py-3 px-4 font-medium">Fecha</th>
                <th className="py-3 px-4 font-medium">Nombre</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Organización</th>
                <th className="py-3 px-4 font-medium">Cargo</th>
                <th className="py-3 px-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {busy && (
                <tr><td colSpan={6} className="text-center py-12 text-steel">Cargando solicitudes…</td></tr>
              )}
              {!busy && rows.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-steel">Sin solicitudes registradas.</td></tr>
              )}
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-secondary/30 transition">
                  <td className="py-3 px-4 text-steel text-xs whitespace-nowrap">
                    {new Date(l.created_at).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 px-4 text-navy">{l.full_name}</td>
                  <td className="py-3 px-4 text-steel">{l.email ?? "—"}</td>
                  <td className="py-3 px-4 text-steel">{l.organization ?? "—"}</td>
                  <td className="py-3 px-4 text-steel">{l.role_title ?? "—"}</td>
                  <td className="py-3 px-4">
                    <Select
                      value={ESTADOS.find((e) => e.value === l.status)?.value ?? "new"}
                      onValueChange={(v) => updateStatus(l.id, v)}
                    >
                      <SelectTrigger className="h-9 w-36 rounded-none border-border text-xs uppercase tracking-wider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminLeads;
