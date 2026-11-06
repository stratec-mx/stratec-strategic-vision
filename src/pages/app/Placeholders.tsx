import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Construction, ShieldCheck, UserPlus, RefreshCw, Shield, Eye, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, Role } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export const ComingSoon = ({ title, eyebrow, description }: { title: string; eyebrow: string; description: string }) => (
  <div>
    <PageHeader eyebrow={eyebrow} title={title} description={description} />
    <div className="border border-dashed border-border bg-card p-16 flex flex-col items-center text-center">
      <Construction className="h-8 w-8 text-olive mb-4" />
      <div className="font-display text-xl text-navy">Módulo en preparación</div>
      <p className="mt-2 text-sm text-steel max-w-md">
        Este módulo será habilitado en la siguiente etapa del despliegue Fase 2.
      </p>
    </div>
  </div>
);

export const Messaging = () => (
  <ComingSoon
    eyebrow="Comunicaciones"
    title="Mensajería · WhatsApp & Correo"
    description="Bandeja unificada de canales institucionales."
  />
);

const ROLE_OPTIONS: { value: Role; label: string; description: string; icon: typeof Shield }[] = [
  { value: "admin",      label: "Administrador", description: "Acceso total al sistema",         icon: Shield },
  { value: "analyst",    label: "Analista",       description: "Lectura y análisis de datos",     icon: Eye },
  { value: "operations", label: "Operaciones",    description: "Gestión de leads y clientes",     icon: Settings2 },
  { value: "executive",  label: "Ejecutivo",      description: "Vista ejecutiva y reportes",      icon: Eye },
  { value: "viewer",     label: "Solo lectura",   description: "Consulta sin modificaciones",     icon: Eye },
];

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role | "none";
  created_at: string;
};

const NO_ROLE = "none";
const SUPABASE_PROJECT = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;

export const Settings = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Lista TODOS los usuarios registrados (tabla profiles, visible para admins),
  // con su rol si lo tienen. Así los usuarios nuevos sin rol aparecen aquí.
  const load = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (p.error || r.error) {
      toast({ title: "No se pudo cargar la lista de usuarios", description: (p.error ?? r.error)?.message, variant: "destructive" });
      setRows([]);
      setLoading(false);
      return;
    }
    const roleOf = new Map<string, Role>();
    // Si un usuario tuviera varios roles, se muestra el de mayor privilegio
    const rank: Role[] = ["admin", "analyst", "operations", "executive", "viewer"];
    for (const x of r.data ?? []) {
      const cur = roleOf.get(x.user_id as string);
      const next = x.role as Role;
      if (!cur || rank.indexOf(next) < rank.indexOf(cur)) roleOf.set(x.user_id as string, next);
    }
    setRows(
      (p.data ?? []).map((u) => ({
        id: u.id as string,
        email: (u.email as string) ?? (u.id as string),
        name: (u.full_name as string) ?? "",
        role: roleOf.get(u.id as string) ?? NO_ROLE,
        created_at: u.created_at as string,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const admins = rows.filter((x) => x.role === "admin").length;

  const updateRole = async (target: UserRow, role: Role | "none") => {
    if (target.id === user?.id) {
      toast({ title: "Acción no permitida", description: "No puedes cambiar tu propio rol. Pide a otro administrador que lo haga.", variant: "destructive" });
      return;
    }
    if (target.role === "admin" && role !== "admin" && admins <= 1) {
      toast({ title: "Acción no permitida", description: "Debe existir al menos un administrador.", variant: "destructive" });
      return;
    }
    setBusy(target.id);
    if (role === NO_ROLE) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", target.id);
      setBusy(null);
      if (error) { toast({ title: "Error al revocar acceso", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Acceso revocado", description: `${target.email} ya no puede entrar al panel.` });
      load();
      return;
    }
    // Primero se agrega el rol nuevo y después se quitan los demás:
    // el usuario nunca queda sin rol a mitad del cambio.
    const { error: insErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: target.id, role }, { onConflict: "user_id,role", ignoreDuplicates: true });
    if (insErr) {
      setBusy(null);
      toast({ title: "Error al asignar rol", description: insErr.message, variant: "destructive" });
      return;
    }
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", target.id).neq("role", role);
    setBusy(null);
    if (delErr) toast({ title: "Rol asignado con advertencia", description: `No se pudo quitar el rol anterior: ${delErr.message}`, variant: "destructive" });
    else toast({ title: "Rol actualizado", description: `${target.email}: ${ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role}.` });
    load();
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader eyebrow="Configuración" title="Ajustes" description="Roles, permisos y preferencias de la firma." />
        <div className="border border-border bg-card p-10 text-center">
          <ShieldCheck className="h-8 w-8 text-olive mx-auto mb-3" />
          <div className="font-display text-lg text-navy">Acceso restringido</div>
          <p className="mt-2 text-sm text-steel max-w-md mx-auto">
            La gestión de usuarios y permisos está reservada a administradores.
          </p>
        </div>
      </div>
    );
  }

  const usersUrl = SUPABASE_PROJECT ? `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/auth/users` : "https://supabase.com/dashboard";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Configuración · Acceso institucional"
        title="Usuarios y permisos"
        description="Asigne roles a los colaboradores registrados y controle el acceso al panel operativo."
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {ROLE_OPTIONS.map((r) => (
          <div key={r.value} className="border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <r.icon className="h-3.5 w-3.5 text-olive" />
              <span className="text-xs font-medium text-navy uppercase tracking-wider">{r.label}</span>
            </div>
            <p className="text-[11px] text-steel">{r.description}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-steel">
          {rows.length} usuario(s) registrados · {rows.filter((x) => x.role === NO_ROLE).length} sin rol
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="rounded-none text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar
          </Button>
          <Button size="sm" onClick={() => setShowHelp(!showHelp)} className="rounded-none bg-navy text-smoke text-xs gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Agregar colaborador
          </Button>
        </div>
      </div>

      {showHelp && (
        <div className="border border-border bg-card p-6 space-y-3 text-sm">
          <div className="font-display text-base text-navy">Cómo agregar un colaborador</div>
          <p className="text-steel">El registro público está cerrado por seguridad, así que las cuentas se crean desde Supabase:</p>
          <ol className="list-decimal pl-5 space-y-1 text-navy">
            <li>
              Abre{" "}
              <a href={usersUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Supabase → Authentication → Users
              </a>{" "}
              y presiona <b>Add user → Create new user</b>.
            </li>
            <li>Escribe su correo y una contraseña temporal, marca <b>Auto Confirm User</b> y crea la cuenta.</li>
            <li>Vuelve aquí, presiona <b>Actualizar</b> y asígnale un rol en la tabla de abajo.</li>
          </ol>
          <p className="text-[11px] text-steel">Comparte la contraseña temporal por un medio seguro y pídele que la cambie.</p>
        </div>
      )}

      <div className="border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-steel">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Usuario</th>
              <th className="text-left px-6 py-3 font-medium">Registrado</th>
              <th className="text-left px-6 py-3 font-medium w-56">Rol</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-steel">Cargando usuarios…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-steel">Sin usuarios registrados.</td></tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className={`border-t border-border ${u.id === user?.id ? "bg-secondary/20" : ""}`}>
                  <td className="px-6 py-3">
                    <div className="text-navy">{u.email}{u.id === user?.id ? " (tú)" : ""}</div>
                    {u.name && u.name !== u.email && <div className="text-xs text-steel">{u.name}</div>}
                  </td>
                  <td className="px-6 py-3 text-steel text-xs">
                    {new Date(u.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-3">
                    <Select value={u.role} onValueChange={(v) => updateRole(u, v as Role | "none")} disabled={busy === u.id || u.id === user?.id}>
                      <SelectTrigger className={`rounded-none h-8 text-xs ${u.role === NO_ROLE ? "text-amber-700" : ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                        <SelectItem value={NO_ROLE}>Sin acceso</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-border bg-secondary/30 p-4 flex gap-3">
        <ShieldCheck className="h-4 w-4 text-olive mt-0.5 shrink-0" />
        <div className="text-xs text-steel leading-relaxed">
          <span className="font-medium text-navy">Seguridad:</span> los permisos los aplica la base de datos en cada consulta.
          Un usuario sin rol puede iniciar sesión, pero no ve ni modifica información del CRM.
          Para mayor seguridad, active la autenticación de dos factores desde la consola de Supabase.
        </div>
      </div>
    </div>
  );
};
