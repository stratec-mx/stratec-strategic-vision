import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { ArrowRight, Lock } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  fullName: z.string().trim().min(2).max(120).optional(),
});

const Auth = () => {
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate("/app", { replace: true });
  }, [session, navigate]);

  if (loading) return null;
  if (session) return <Navigate to="/app" replace />;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast({ title: "Revise los campos", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: parsed.data.fullName ?? "" },
          },
        });
        if (error) throw error;
        toast({ title: "Cuenta creada", description: "Revise su correo para confirmar el acceso." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        navigate("/app", { replace: true });
      }
    } catch (err: any) {
      console.error("[Auth]", err);
      const msg = err?.message?.includes("Invalid login")
        ? "Credenciales no válidas."
        : "No fue posible procesar la solicitud. Intente nuevamente.";
      toast({ title: "Acceso no disponible", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-smoke">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[var(--gradient-hero)] text-smoke relative overflow-hidden">
        <div className="grid-bg-light absolute inset-0 opacity-30" />
        <Logo size="md" variant="light" />
        <div className="relative">
          <div className="eyebrow text-smoke/60">— Acceso institucional</div>
          <h1 className="font-display text-4xl font-light mt-4 leading-tight">
            Plataforma operativa <span className="text-olive">STRATEC</span>.
          </h1>
          <p className="mt-6 text-smoke/70 max-w-md font-light leading-relaxed">
            Inteligencia estratégica, pipeline comercial y seguimiento institucional
            en un único entorno seguro.
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-smoke/50">
          <Lock className="h-3 w-3" /> Sesión cifrada · acceso restringido
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8"><Logo size="md" variant="dark" /></div>
          <div className="eyebrow mb-3">— {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}</div>
          <h2 className="font-display text-3xl text-navy font-light">
            {mode === "signin" ? "Acceda a su panel" : "Solicite su acceso"}
          </h2>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-steel">Nombre completo</Label>
                <Input name="fullName" required maxLength={120} className="rounded-none h-11" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-steel">Correo institucional</Label>
              <Input name="email" type="email" required maxLength={255} className="rounded-none h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-steel">Contraseña</Label>
              <Input name="password" type="password" required minLength={8} maxLength={72} className="rounded-none h-11" />
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-none bg-navy hover:bg-navy-deep text-smoke tracking-wider text-xs uppercase h-12 group">
              {busy ? "Procesando..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 text-xs text-steel hover:text-navy transition"
          >
            {mode === "signin" ? "¿No tiene cuenta? Solicitar acceso →" : "¿Ya tiene cuenta? Iniciar sesión →"}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
