import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DIAS_HABILES = [1, 2, 3, 4, 5, 6]; // lunes(1) a sábado(6), domingo(0) excluido

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const nombre = String(body.nombre ?? "").trim();
    const email = String(body.email ?? "").trim();
    const telefono = String(body.telefono ?? "").trim();
    const fecha = String(body.fecha ?? "").trim(); // YYYY-MM-DD
    const hora = String(body.hora ?? "").trim(); // HH:MM
    const mensaje = String(body.mensaje ?? "").trim();

    if (!nombre || !email || !fecha || !hora) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [y, m, d] = fecha.split("-").map(Number);
    const fechaLocal = new Date(y, (m || 1) - 1, d || 1);
    if (Number.isNaN(fechaLocal.getTime()) || !DIAS_HABILES.includes(fechaLocal.getDay())) {
      return new Response(JSON.stringify({ error: "fecha fuera de días hábiles (lunes a sábado)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (hora < "08:00" || hora > "18:00") {
      return new Response(JSON.stringify({ error: "hora fuera de rango (08:00 a 18:00)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase.from("reuniones").insert({
      nombre,
      email,
      telefono,
      fecha,
      hora,
      mensaje,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
