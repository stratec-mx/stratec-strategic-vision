-- ═══════════════════════════════════════════════════════════════════════════
-- STRATEC · Configuración de base de datos · PASO 1 de 2: tipos (enums)
-- Ejecutar en Supabase → SQL Editor → Run. Es seguro ejecutarlo más de una vez.
-- Después ejecutar 02-tablas-y-permisos.sql en una consulta NUEVA.
-- ═══════════════════════════════════════════════════════════════════════════

do $$ begin
  create type public.app_role as enum ('admin', 'executive', 'analyst', 'operations', 'viewer');
exception when duplicate_object then null; end $$;

alter type public.app_role add value if not exists 'admin';
alter type public.app_role add value if not exists 'executive';
alter type public.app_role add value if not exists 'analyst';
alter type public.app_role add value if not exists 'operations';
alter type public.app_role add value if not exists 'viewer';

do $$ begin
  create type public.lead_status as enum ('new','contacted','qualified','unqualified','converted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_source as enum ('web','referral','event','outbound','partner','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deal_stage as enum ('prospeccion','diagnostico','propuesta','negociacion','cierre','perdido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_type as enum ('note','call','email','meeting','whatsapp','task','stage_change');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quote_status as enum ('draft','sent','accepted','rejected','expired');
exception when duplicate_object then null; end $$;
