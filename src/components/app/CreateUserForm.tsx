import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_CHOICES = [
  { value: "admin", label: "Administrador" },
  { value: "analyst", label: "Analista" },
  { value: "operations", label: "Operaciones" },
  { value: "executive", label: "Ejecutivo" },
  { value: "viewer", label: "Solo lectura" },
  { value: "none", label: "Sin acceso (asignar después)" },
];

const SUPABASE_PROJECT = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;

/** Contraseña temporal aleatoria (12 caracteres, sin símbolos ambiguos). */
const randomPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const buf = new Uint32Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join("");
};

/**
 * Alta de usuarios desde el dashboard. Llama a la Edge Function
 * admin-create-user, que verifica que quien llama sea admin y crea la cuenta
 * ya confirmada (el registro público está cerrado).
 */
export const CreateUserForm = ({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState(randomPassword);
  const [role, setRole] = useState("operations");
  const [busy, setBusy] = useState(false);
  const [fnMissing, setFnMissing] = useState(false);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({ title: "Correo inválido", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Contraseña muy corta", description: "Mínimo 8 caracteres.", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { email: email.trim().toLowerCase(), full_name: fullName.trim(), password, role },
    });
    setBusy(false);

    if (error) {
      // FunctionsHttpError trae la respuesta; 404 = la función no está desplegada
      const status = (error as any)?.context?.status;
      let message = error.message;
      try {
        const body = await (error as any)?.context?.json?.();
        if (body?.error) message = body.error;
      } catch { /* sin cuerpo JSON */ }
      if (status === 404) {
        setFnMissing(true);
        message = "La función admin-create-user aún no está desplegada en Supabase.";
      }
      toast({ title: "No se pudo crear el usuario", description: message, variant: "destructive" });
      return;
    }
    if (data?.warning) toast({ title: "Usuario creado con advertencia", description: data.warning, variant: "destructive" });
    else toast({ title: "Usuario creado", description: `${email} ya puede iniciar sesión con la contraseña temporal.` });
    setEmail("");
    setFullName("");
    setPassword(randomPassword());
    onCreated();
  };

  const usersUrl = SUPABASE_PROJECT ? `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/auth/users` : "https://supabase.com/dashboard";

  return (
    <div className="border border-border bg-card p-6 space-y-4">
      <div className="font-display text-base text-navy">Nuevo usuario</div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-steel">Correo</Label>
          <Input type="email" placeholder="usuario@stratecsecurity.com" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-none h-10 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-steel">Nombre</Label>
          <Input placeholder="Nombre y apellido" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-none h-10 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-steel">Contraseña temporal</Label>
          <div className="flex gap-2">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-none h-10 text-sm font-mono" />
            <Button type="button" variant="outline" onClick={() => setPassword(randomPassword())} className="rounded-none h-10 px-3" aria-label="Generar otra contraseña">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-steel">Rol</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="rounded-none h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLE_CHOICES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={submit} disabled={busy} className="rounded-none bg-navy text-smoke text-xs h-9">
          {busy ? "Creando…" : "Crear usuario"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="rounded-none text-xs h-9">Cancelar</Button>
      </div>
      <p className="text-[11px] text-steel">
        La cuenta queda confirmada y puede entrar de inmediato. Comparte la contraseña temporal por un medio seguro y pídele que la cambie.
      </p>
      {fnMissing && (
        <div className="border border-amber-300 bg-amber-50 p-3 text-xs text-navy space-y-1">
          <div>Mientras se despliega la función, puedes crear la cuenta manualmente:</div>
          <div>
            <a href={usersUrl} target="_blank" rel="noopener noreferrer" className="underline">Supabase → Authentication → Users</a> →
            Add user → Create new user (marca Auto Confirm User). Luego asígnale el rol en la tabla de abajo.
          </div>
        </div>
      )}
    </div>
  );
};
