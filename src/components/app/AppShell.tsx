import { ReactNode } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Target, GitBranch, FileText,
  CalendarDays, BarChart3, MessageSquare, Settings, LogOut, Search, ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/leads", label: "Leads", icon: Target },
  { to: "/app/clients", label: "Clientes", icon: Users },
  { to: "/app/pipeline", label: "Pipeline", icon: GitBranch },
  { to: "/app/quotes", label: "Cotizaciones", icon: FileText },
  { to: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/app/analytics", label: "Analítica", icon: BarChart3 },
  { to: "/app/messaging", label: "Mensajería", icon: MessageSquare },
];

export const AppShell = ({ children }: { children?: ReactNode }) => {
  const { session, loading, hasAccess, user, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-steel text-sm">Verificando acceso…</div>;
  }
  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />;

  // Authenticated but no role assigned — block all access
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoke p-6">
        <div className="max-w-md w-full border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <div className="h-14 w-14 rounded-full bg-olive/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="h-7 w-7 text-olive" />
          </div>
          <div className="eyebrow mb-3">— Acceso pendiente</div>
          <h1 className="font-display text-2xl text-navy font-light">Su cuenta no tiene permisos asignados</h1>
          <p className="mt-4 text-sm text-steel leading-relaxed">
            Su sesión es válida pero aún no tiene un rol institucional autorizado.
            Contacte al administrador para habilitar su acceso al panel operativo.
          </p>
          <p className="mt-4 text-xs text-steel/80">
            <a href="mailto:contacto@stratecsecurity.com" className="text-navy underline underline-offset-2">
              contacto@stratecsecurity.com
            </a>
          </p>
          <Button
            onClick={signOut}
            className="mt-8 w-full rounded-none bg-navy hover:bg-navy-deep text-smoke tracking-wider text-xs uppercase h-11"
          >
            <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-smoke">
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
        <div className="h-20 px-6 flex items-center border-b border-border">
          <Logo size="sm" variant="dark" />
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors ${
                  isActive
                    ? "bg-navy text-smoke"
                    : "text-steel hover:bg-secondary hover:text-navy"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <NavLink to="/app/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-steel hover:text-navy">
            <Settings className="h-4 w-4" /> Ajustes
          </NavLink>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-steel hover:text-navy">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 lg:px-8">
          <div className="relative w-full max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
            <Input placeholder="Buscar leads, clientes, deals…" className="pl-9 rounded-none border-border h-10 bg-secondary/40" />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <div className="text-xs text-steel uppercase tracking-wider">Sesión</div>
              <div className="text-sm text-navy font-medium">{user?.email}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="lg:hidden"><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="flex-1 p-6 lg:p-10 overflow-auto"
        >
          {children ?? <Outlet />}
        </motion.main>
      </div>
    </div>
  );
};
