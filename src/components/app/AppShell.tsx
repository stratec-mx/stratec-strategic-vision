import { ReactNode, Suspense, useEffect, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu, Search, ShieldAlert, Settings } from "lucide-react";
import { useAuth, type Role } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import mark from "@/assets/stratec-mark.png";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { haceCuanto } from "@/lib/panelGeneral";
import { MODULOS, esProduccion, migas } from "./panelNav";
import { BuscadorPanel } from "./BuscadorPanel";
import { usePanelAvisos, type Contadores } from "./usePanelAvisos";
import "./panel.css";

const ROL: Record<Role, string> = {
  admin: "Administrador", analyst: "Analista", operations: "Operaciones",
  advisor: "Asesor", executive: "Ejecutivo", viewer: "Solo lectura",
};
const PRODUCCION = esProduccion(import.meta.env.VITE_SUPABASE_URL);

const Icono = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d={d} />
  </svg>
);

/** Menú lateral azul marino. Se usa fijo en escritorio y dentro del menú desplegable en celular. */
const MenuLateral = ({ contadores, onNavigate }: { contadores: Contadores; onNavigate?: () => void }) => {
  const { can } = useAuth();
  return (
    <nav aria-label="Navegación principal" className="flex h-full flex-col gap-[22px] bg-pn-navy px-3.5 pb-[18px] pt-[22px]">
      <Link to="/app" onClick={onNavigate} className="flex flex-col gap-1.5 px-2.5 pt-0.5 hover:no-underline">
        <span className="flex items-center gap-2.5">
          <img src={mark} alt="" className="h-9 w-9 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
          <span className="text-[19px] font-light text-white" style={{ letterSpacing: "0.2em" }}>STRATEC</span>
        </span>
        <span className="text-[10.5px] font-medium text-[#9AA3AF]" style={{ letterSpacing: "0.14em" }}>CONSULTORÍA Y GESTIÓN ESTRATÉGICA</span>
      </Link>
      <div className="panel-nav -mr-1.5 flex flex-1 flex-col gap-0.5 overflow-y-auto pr-1.5">
        {MODULOS.filter((m) => !m.resource || can(m.resource)).map((m) => {
          const n = m.contador ? contadores[m.contador] : 0;
          return (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-[9px] text-[13.5px] font-medium transition-colors ${
                  isActive ? "bg-[rgba(247,247,245,0.12)] text-white" : "text-pn-menu hover:bg-[rgba(247,247,245,0.08)] hover:text-pn-calido"
                }`
              }
            >
              <Icono d={m.d} />
              <span className="flex-1">{m.label}</span>
              {n > 0 && (
                <span className="tnum rounded-[10px] bg-pn-menu px-[7px] py-px text-[11px] font-semibold text-pn-navy" aria-label={`${n} pendientes`}>{n}</span>
              )}
            </NavLink>
          );
        })}
      </div>
      <div className="flex flex-col gap-1 border-t border-[rgba(247,247,245,0.12)] px-2.5 pt-3">
        <span className="text-[11px] text-[#9AA3AF]">Cuernavaca, Morelos</span>
        <span className="text-[11px] text-[#9AA3AF]">Versión 1.0 · {PRODUCCION ? "Entorno privado" : "Entorno de prueba"}</span>
      </div>
    </nav>
  );
};

const AvisoEntorno = () =>
  PRODUCCION ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-pn-borde bg-pn-calido px-2.5 py-[5px] text-xs font-medium text-pn-texto">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#287A59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      Entorno privado
    </span>
  ) : (
    <span
      title="El panel está conectado a una base de datos distinta a la de producción."
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-pn-aviso bg-[#FDF6E7] px-2.5 py-[5px] text-xs font-semibold text-[#8A5A12]"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B7791F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l9.5 17h-19zM12 10v4M12 17h.01" /></svg>
      Entorno de prueba
    </span>
  );

const COLOR_AVISO = { lead: "#0B1F3A", cotizacion: "#B7791F", cita: "#287A59" } as const;

const Campana = ({ datos }: { datos: ReturnType<typeof usePanelAvisos> }) => {
  const { avisos, sinLeer, vistos, marcarVistos } = datos;
  return (
    <Popover onOpenChange={(abierto) => { if (!abierto) marcarVistos(); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={sinLeer ? `Notificaciones, ${sinLeer} sin leer` : "Notificaciones"}
          className="relative inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-pn-borde bg-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#172333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>
          {sinLeer > 0 && (
            <span className="tnum absolute -right-[5px] -top-[5px] flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-pn-alerta px-1 text-[10.5px] font-semibold text-white">
              {sinLeer > 99 ? "99+" : sinLeer}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] max-w-[calc(100vw-32px)] rounded-lg border-pn-borde p-0">
        <div className="flex items-center justify-between border-b border-pn-borde px-4 py-3">
          <span className="text-sm font-semibold text-pn-texto">Notificaciones</span>
          <span className="tnum text-xs text-pn-sub">{avisos.length ? `${avisos.length} pendientes` : ""}</span>
        </div>
        {avisos.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-pn-sub">Nada pendiente por ahora.</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto">
            {avisos.map((a) => (
              <li key={a.id} className="border-b border-pn-borde last:border-0">
                <Link to={a.href} className="flex gap-3 px-4 py-3 hover:bg-pn-calido hover:no-underline">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: COLOR_AVISO[a.tipo] }} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className={`text-[13px] text-pn-texto ${vistos.includes(a.id) ? "font-normal" : "font-semibold"}`}>{a.titulo}</span>
                    <span className="truncate text-xs text-pn-sub">{a.detalle}</span>
                    {a.tipo === "lead" && <span className="tnum text-[11px] text-pn-sub">{haceCuanto(a.fecha)}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

const Perfil = () => {
  const { user, roles, signOut } = useAuth();
  const [nombre, setNombre] = useState<string>("");
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setNombre(data?.full_name?.trim() ?? ""));
  }, [user]);
  const mostrado = nombre || user?.email || "";
  const iniciales = (nombre ? nombre.split(/\s+/).map((p) => p[0]).join("") : (user?.email ?? "?")[0]).slice(0, 2).toUpperCase();
  const rol = roles.includes("admin") ? ROL.admin : roles.map((r) => ROL[r]).join(", ");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Perfil de usuario" className="inline-flex items-center gap-2.5 text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pn-navy text-[13px] font-semibold text-pn-calido">{iniciales}</span>
          <span className="hidden min-w-0 flex-col gap-px sm:flex">
            <span className="max-w-[180px] truncate text-[13px] font-semibold text-pn-texto">{mostrado}</span>
            <span className="text-[11.5px] text-pn-sub">{rol}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 border-pn-borde">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-[13px] font-semibold text-pn-texto">{mostrado}</div>
          <div className="truncate text-xs text-pn-sub">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/settings" className="cursor-pointer text-[13px]"><Settings className="mr-2 h-4 w-4" /> Configuración</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut} className="cursor-pointer text-[13px]">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const AppShell = ({ children }: { children?: ReactNode }) => {
  const { session, loading, hasAccess, signOut } = useAuth();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [buscar, setBuscar] = useState(false);
  const avisos = usePanelAvisos(location.pathname);

  // El sistema visual del panel aplica también a menús y ventanas que se abren fuera del contenido.
  useEffect(() => {
    document.documentElement.classList.add("panel-theme");
    return () => document.documentElement.classList.remove("panel-theme");
  }, []);

  useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setBuscar((v) => !v); }
    };
    window.addEventListener("keydown", atajo);
    return () => window.removeEventListener("keydown", atajo);
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-pn-fondo text-sm text-pn-sub">Verificando acceso…</div>;
  }
  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />;

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pn-fondo p-4">
        <div className="max-w-md rounded-lg border border-pn-borde bg-white p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-pn-oliva" />
          <div className="mb-2 text-lg font-semibold text-pn-texto">Sin rol asignado</div>
          <p className="mb-4 text-sm text-pn-sub">
            Su sesión es válida pero su cuenta aún no tiene un rol asignado.
            Pida a un administrador que se lo asigne en Configuración → Usuarios y permisos.
          </p>
          <a href="mailto:contacto@stratecsecurity.com" className="text-xs text-pn-navy underline underline-offset-2">contacto@stratecsecurity.com</a>
          <div className="mt-6">
            <button onClick={signOut} className="text-xs text-pn-sub underline underline-offset-2 hover:text-pn-navy">Cerrar sesión</button>
          </div>
        </div>
      </div>
    );
  }

  const ruta = migas(location.pathname);
  const titulo = ruta[ruta.length - 1].label === "Detalle" ? ruta[ruta.length - 2].label : ruta[ruta.length - 1].label;

  return (
    <div className="flex min-h-screen bg-pn-fondo font-sans text-pn-texto">
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 lg:block">
        <MenuLateral contadores={avisos.contadores} />
      </aside>

      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="left" className="w-[272px] max-w-[85vw] border-0 bg-pn-navy p-0 text-white [&>button]:text-white">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <MenuLateral contadores={avisos.contadores} onNavigate={() => setMenuAbierto(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-pn-borde bg-white px-4 py-3 sm:px-7">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-pn-borde lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
          <div className="flex min-w-0 flex-[1_1_180px] flex-col gap-0.5">
            <nav aria-label="Ruta" className="flex items-center gap-1.5 text-xs text-pn-sub">
              {ruta.map((m, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {m.to ? <Link to={m.to} className="text-pn-sub hover:underline">{m.label}</Link> : <span className="text-pn-texto">{m.label}</span>}
                </span>
              ))}
            </nav>
            <h1 className="truncate text-xl font-semibold tracking-[-0.01em] text-pn-texto">{titulo}</h1>
          </div>
          <button
            type="button"
            onClick={() => setBuscar(true)}
            className="hidden h-[38px] min-w-[200px] flex-[0_1_340px] items-center gap-2 rounded-md border border-pn-borde bg-pn-calido px-3 text-left md:flex"
          >
            <Search className="h-4 w-4 shrink-0 text-pn-sub" />
            <span className="flex-1 truncate text-[13px] text-pn-sub">Buscar cliente, prospecto o folio</span>
            <span className="rounded border border-pn-borde bg-white px-[5px] py-px text-[11px] text-pn-sub">Ctrl K</span>
          </button>
          <div className="ml-auto flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setBuscar(true)}
              aria-label="Buscar"
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-md border border-pn-borde md:hidden"
            >
              <Search className="h-4 w-4" />
            </button>
            <span className="hidden sm:inline-flex"><AvisoEntorno /></span>
            <Campana datos={avisos} />
            <Perfil />
          </div>
          {!PRODUCCION && <span className="w-full sm:hidden"><AvisoEntorno /></span>}
        </header>

        <main className="panel-main flex-1 overflow-x-hidden px-4 pb-7 pt-[22px] sm:px-7">
          {children ?? <Suspense fallback={<div className="p-8 text-sm text-pn-sub">Cargando…</div>}><Outlet /></Suspense>}
        </main>
      </div>

      <BuscadorPanel open={buscar} onOpenChange={setBuscar} />
    </div>
  );
};
