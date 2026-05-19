## Fase 2 STRATEC — Plan por etapas

Stack confirmado: **Vite + React + Tailwind + shadcn/ui + Framer Motion + Lovable Cloud (Supabase)**. Estilo Palantir / McKinsey — minimal ejecutivo, fondo claro, acentos navy/olive, grids densos, tipografía editorial.

---

### Etapa A — Fundación CRM (este turno)

**Backend (Lovable Cloud)**
- Habilitar Cloud.
- Tablas: `profiles`, `user_roles` (enum admin/executive/analyst) con función `has_role` SECURITY DEFINER.
- Tablas CRM: `leads`, `clients`, `deals` (pipeline), `activities` (timeline), `quotes` (cotizaciones), `appointments`.
- RLS estricto: solo usuarios autenticados con rol válido leen/escriben; admin = full access.

**Auth**
- `/auth` — login/registro email+password con `emailRedirectTo`.
- Listener `onAuthStateChange` + guard de rutas privadas.

**Layout admin `/app`**
- Sidebar colapsable (shadcn) con secciones: Dashboard, Leads, Clientes, Pipeline, Cotizaciones, Agenda, Analítica, Mensajería, Ajustes.
- Header con búsqueda global, perfil, logout.

**Módulos UI (Etapa A)**
1. `/app` Dashboard ejecutivo — 4 KPIs (leads nuevos, pipeline valor, conversión, citas próximas), gráfico de tendencia, lista de actividad reciente.
2. `/app/leads` — tabla corporativa con filtros (estado, fuente, fecha, score), drawer de detalle, formulario de alta.
3. `/app/clients` — tabla de clientes activos, ficha con timeline.
4. `/app/pipeline` — vista Kanban (5 etapas: Prospección, Diagnóstico, Propuesta, Negociación, Cierre) con drag-and-drop, totales por columna.

**Reemplazo Calendly → Google Appointment Schedule**
- `/schedule` cambia el embed Calendly por iframe del booking page de Google Workspace. Variable `GOOGLE_BOOKING_URL` (placeholder hasta que pegues tu link).

---

### Etapa B — Comercial + Agenda + Analítica (siguiente turno)
5. Cotizaciones — builder, PDF, estados.
6. Agenda ejecutiva interna — sincronización con `appointments`, lista + calendario semanal.
7. Analytics corporativo — funnel de conversión, performance por ejecutivo, cohortes.

### Etapa C — Comunicaciones (turno final)
8. WhatsApp Business Cloud API (Meta) — edge function `whatsapp-send`, webhook receptor, bandeja conversacional.
9. Correo corporativo vía Resend — edge function `email-send`, plantillas premium HTML.
10. Panel de seguimiento — secuencias automáticas (lead nuevo → email bienvenida → recordatorio WhatsApp 48h).
11. Automatización: trigger DB que crea actividad al cambiar etapa de deal, scoring automático de leads.

---

### Notas técnicas

- Cada módulo nuevo es una ruta lazy-loaded bajo `/app/*` con su propio archivo en `src/pages/app/`.
- Componentes reutilizables: `DataTable`, `KpiCard`, `EmptyState`, `PageHeader`, `StatusBadge`, `KanbanColumn`.
- Sistema de diseño existente (navy / olive / smoke / steel) se reutiliza — no se rompen tokens.
- Animaciones con Framer Motion: fade+slide en montaje de páginas, layout animations en Kanban.
- Secrets que pediré en Etapa C: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`. Resend vía connector.

Confirma para comenzar Etapa A.