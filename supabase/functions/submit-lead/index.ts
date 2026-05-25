import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
          return new Response("ok", { headers: CORS_HEADERS });
    }

        try {
              // — 1. Parse & validate input ————————————————————————
      const body = await req.json().catch(() => null);
              if (!body) {
                      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
                                status: 400,
                                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                      });
              }

      const { name, email, organization, role, message, honeypot } = body;

      // Honeypot check (secondary server-side defence)
      if (honeypot) {
              // Bot – silently return 200 so it thinks it succeeded
                return new Response(JSON.stringify({ ok: true }), {
                                                  status: 200,
                          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                });
      }

      if (!name || !email || !organization || !message) {
              return new Response(JSON.stringify({ error: "Missing required fields" }), {
                        status: 422,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
              });
      }

      // — Email format validation ————————————————————————
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(String(email))) {
                      return new Response(JSON.stringify({ error: "Formato de email invalido" }), {
                                status: 422,
                                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                      });
              }

      // — 2. Supabase client with service-role key (bypasses RLS) ————————————
      const supabase = createClient(
              Deno.env.get("SUPABASE_URL") ?? "",
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            );

      // — 3. Server-side IP rate limiting ————————————————————————
      const clientIp =
              req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
              req.headers.get("x-real-ip") ??
        "unknown";

      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

      const { count, error: countErr } = await supabase
                .from("rate_limits")
                .select("*", { count: "exact", head: true })
                .eq("ip", clientIp)
                .eq("endpoint", "submit_lead")
                .gte("created_at", windowStart);

      if (countErr) {
              console.error("[submit-lead] rate limits count error:", countErr.message);
              // Fail open – do not block the user for a DB error
      } else if ((count ?? 0) >= RATE_LIMIT_MAX) {
              return new Response(
                        JSON.stringify({
                                    error: "Ha alcanzado el limite de solicitudes. Por favor espere 15 minutos antes de intentarlo de nuevo.",
                        }),
                {
                            status: 429,
                            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                },
                      );
      }

      // Record this attempt
      await supabase.from("rate_limits").insert({
              ip: clientIp,
              endpoint: "submit_lead",
                  });

      // — 4. Insert the lead ————————————————————————
      const { error: insertErr } = await supabase.from("leads").insert({
              full_name: String(name).substring(0, 100),
              email: String(email).substring(0, 255),
              organization: String(organization).substring(0, 150),
              role_title: role ? String(role).substring(0, 120) : null,
              notes: String(message).substring(0, 1000),
              source: "web",
              status: "new",
              owner_id: null,
      });

      if (insertErr) {
              console.error("[submit-lead] insert error:", insertErr.message);
              return new Response(
                        JSON.stringify({ error: "No se pudo procesar la solicitud. Intente de nuevo." }),
                {
                            status: 500,
                            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                },
                      );
      }

      return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
        } catch (err) {
              console.error("[submit-lead] unexpected error:", err);
              return new Response(JSON.stringify({ error: "Internal server error" }), {
                      status: 500,
                      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
              });
        }
});
