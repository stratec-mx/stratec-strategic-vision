// Crea un usuario del dashboard y le asigna rol. Solo la puede usar un admin.
// El registro público está cerrado, así que esta es la vía para dar de alta
// colaboradores sin entrar a la consola de Supabase.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLES = ["admin", "analyst", "operations", "executive", "viewer"] as const;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Quién llama: debe tener sesión válida y rol admin
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "Sesión requerida" });
    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) return json(401, { error: "Sesión inválida o expirada. Vuelve a iniciar sesión." });
    const { data: isAdmin } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!isAdmin) return json(403, { error: "Solo un administrador puede crear usuarios." });

    // 2. Validar datos
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const fullName = String(body?.full_name ?? "").trim().slice(0, 120);
    const role = String(body?.role ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(422, { error: "Correo inválido." });
    if (password.length < 8) return json(422, { error: "La contraseña temporal debe tener al menos 8 caracteres." });
    if (role !== "none" && !ROLES.includes(role as (typeof ROLES)[number])) return json(422, { error: "Rol inválido." });

    // 3. Crear la cuenta ya confirmada
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : {},
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message ?? "";
      if (/already|registered|exists/i.test(msg)) return json(409, { error: "Ese correo ya tiene una cuenta. Asígnale el rol en la tabla de usuarios." });
      console.error("[admin-create-user] createUser:", msg);
      return json(500, { error: "No se pudo crear la cuenta." });
    }
    const userId = created.user.id;

    // 4. Perfil (normalmente lo crea el trigger) y rol
    await admin.from("profiles").upsert({ id: userId, email, full_name: fullName || email }, { onConflict: "id" });
    if (role !== "none") {
      const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role });
      if (roleErr) {
        console.error("[admin-create-user] role:", roleErr.message);
        return json(207, { id: userId, warning: "Cuenta creada, pero no se pudo asignar el rol. Asígnalo en la tabla de usuarios." });
      }
    }

    return json(200, { id: userId });
  } catch (err) {
    console.error("[admin-create-user] unexpected:", (err as Error).message);
    return json(500, { error: "Error interno" });
  }
});
