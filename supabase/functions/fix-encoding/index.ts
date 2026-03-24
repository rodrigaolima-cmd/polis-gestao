import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mojibake map (same as client-side)
const MOJIBAKE_MAP: [RegExp, string][] = [
  [/Ã£/g, "ã"], [/Ã¡/g, "á"], [/Ã©/g, "é"], [/Ã­/g, "í"],
  [/Ã³/g, "ó"], [/Ãº/g, "ú"], [/Ã§/g, "ç"], [/Ã¢/g, "â"],
  [/Ãª/g, "ê"], [/Ã´/g, "ô"], [/Ã¼/g, "ü"], [/Ãµ/g, "õ"],
  [/Ã\u0080/g, "À"], [/Ã\u0081/g, "Á"], [/Ã\u0089/g, "É"],
  [/Ã\u008D/g, "Í"], [/Ã\u0093/g, "Ó"], [/Ã\u009A/g, "Ú"],
  [/Ã\u0087/g, "Ç"], [/Ã\u0082/g, "Â"], [/Ã\u008A/g, "Ê"],
  [/Ã\u0094/g, "Ô"], [/Ã\u0095/g, "Õ"], [/Ã\u0083/g, "Ã"],
];

function fixMojibake(text: string): string {
  if (!text) return text;
  let result = text;
  for (const [pattern, replacement] of MOJIBAKE_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let fixed = 0;

    // Fix clients
    const { data: clients } = await supabase.from("clients").select("id, nome_cliente, regiao, consultor, tipo_ug, observacoes_cliente");
    if (clients) {
      for (const c of clients) {
        const updates: Record<string, string> = {};
        for (const field of ["nome_cliente", "regiao", "consultor", "tipo_ug", "observacoes_cliente"] as const) {
          const original = (c as any)[field] || "";
          const cleaned = fixMojibake(original);
          if (cleaned !== original) updates[field] = cleaned;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from("clients").update(updates).eq("id", c.id);
          fixed++;
        }
      }
    }

    // Fix modules
    const { data: modules } = await supabase.from("modules").select("id, nome_modulo");
    if (modules) {
      for (const m of modules) {
        const cleaned = fixMojibake(m.nome_modulo || "");
        if (cleaned !== m.nome_modulo) {
          await supabase.from("modules").update({ nome_modulo: cleaned }).eq("id", m.id);
          fixed++;
        }
      }
    }

    // Fix client_modules observacoes
    const { data: cms } = await supabase.from("client_modules").select("id, observacoes");
    if (cms) {
      for (const cm of cms) {
        const cleaned = fixMojibake(cm.observacoes || "");
        if (cleaned !== (cm.observacoes || "")) {
          await supabase.from("client_modules").update({ observacoes: cleaned }).eq("id", cm.id);
          fixed++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, fixed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
