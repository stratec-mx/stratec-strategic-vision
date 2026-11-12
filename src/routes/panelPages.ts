// Panel interno: se descarga solo al entrar a /app (el visitante del sitio no lo carga).
// No se pide por adelantado: /app no tiene HTML prerenderizado que cuidar.
import { lazy } from "react";

export const AppShell = lazy(() => import("../components/app/AppShell.tsx").then((m) => ({ default: m.AppShell })));
export const RequireAccess = lazy(() => import("../components/app/RequireAccess.tsx").then((m) => ({ default: m.RequireAccess })));
export const Dashboard = lazy(() => import("../pages/app/Dashboard.tsx"));
export const Leads = lazy(() => import("../pages/app/Leads.tsx"));
export const Clients = lazy(() => import("../pages/app/Clients.tsx"));
export const Pipeline = lazy(() => import("../pages/app/Pipeline.tsx"));
export const Quotes = lazy(() => import("../pages/app/Quotes.tsx"));
export const DocumentsList = lazy(() => import("../pages/app/Documents.tsx").then((m) => ({ default: m.DocumentsList })));
export const DocumentEditor = lazy(() => import("../pages/app/Documents.tsx").then((m) => ({ default: m.DocumentEditor })));
export const Agenda = lazy(() => import("../pages/app/Agenda.tsx"));
export const Analytics = lazy(() => import("../pages/app/Analytics.tsx"));
export const Messaging = lazy(() => import("../pages/app/Placeholders.tsx").then((m) => ({ default: m.Messaging })));
export const Settings = lazy(() => import("../pages/app/Placeholders.tsx").then((m) => ({ default: m.Settings })));
export const MapaDemo = lazy(() => import("../pages/MapaDemo.tsx"));
