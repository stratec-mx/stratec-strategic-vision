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
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(1, "Contraseña requerida").max(72),
});

const Auth = () => {
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) throw error;
      navigate("/app", { replace: true });
    } catch (err: any) {
      console.error("[Auth]", err?.code ?? "error");
      toast({
        title: "Acceso restringido",
        description: "Credenciales no válidas. Contacte al administrador del sistema.",
        variant: "destructive",
      });
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
          <div className="eyebrow text-smoke/60">— Portal institucional</div>
          <h1 className="font-display text-4xl font-light mt-4 leading-tight">
            Plataforma operativa <span className="text-olive">STRATEC</span>.
          </h1>
          <p className="mt-6 text-smoke/70 max-w-md font-light leading-relaxed">
            Entorno privado de inteligencia estratégica y seguimiento institucional.
            Acceso exclusivo para personal autorizado.
          </p>
        </div>
        <div className="relative flex flex-col gap-2 text-xs text-smoke/50">
          <div className="flex items-center gap-2"><Lock className="h-3 w-3" /> Sesión cifrada extremo a extremo</div>
          <div className="flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> Acceso restringido por credenciales</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8"><Logo size="md" variant="dark" /></div>
          <div className="eyebrow mb-3">— Acceso autorizado</div>
          <h2 className="font-display text-3xl text-navy font-light">Iniciar sesión institucional</h2>
          <p className="mt-3 text-sm text-steel font-light">
            Ingrese sus credenciales corporativas para acceder al panel operativo.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-steel">Correo institucional</Label>
              <Input name="email" type="email" required maxLength={255} autoComplete="email" className="rounded-none h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-steel">Contraseña</Label>
              <Input name="password" type={showPassword ? "text" : "password"} required maxLength={72} autoComplete="current-password" className="rounded-none h-11" />
              <label className="flex items-center gap-2 text-xs text-steel cursor-pointer">
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="rounded border-border" />
                Mostrar contraseña
              </label>
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-none bg-navy hover:bg-navy-deep text-smoke tracking-wider text-xs uppercase h-12 group">
              {busy ? "Verificando…" : "ACCEDER AL DASHBOARD"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-[11px] text-steel/80 leading-relaxed">
              El acceso a este sistema está restringido a personal autorizado de STRATEC.
              Para solicitar credenciales, escriba a{" "}
              <a href="mailto:contacto@stratecsecurity.com" className="text-navy underline underline-offset-2">
                contacto@stratecsecurity.com
              </a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
