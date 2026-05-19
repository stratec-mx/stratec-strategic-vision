-- touch_updated_at: not security definer, set search_path
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Revoke execute on internal/trigger functions from API roles
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.touch_updated_at() from anon, authenticated, public;
revoke execute on function public.has_any_role(uuid) from anon;
revoke execute on function public.has_role(uuid, public.app_role) from anon;