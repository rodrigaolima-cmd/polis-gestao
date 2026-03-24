import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// All mojibake replacements as [broken, correct] pairs
const REPLACEMENTS: [string, string][] = [
  ["Ã£", "ã"], ["Ã¡", "á"], ["Ã©", "é"], ["Ã­", "í"],
  ["Ã³", "ó"], ["Ãº", "ú"], ["Ã§", "ç"], ["Ã¢", "â"],
  ["Ãª", "ê"], ["Ã´", "ô"], ["Ã¼", "ü"], ["Ãµ", "õ"],
  ["Ã\u0080", "À"], ["Ã\u0081", "Á"], ["Ã\u0089", "É"],
  ["Ã\u008D", "Í"], ["Ã\u0093", "Ó"], ["Ã\u009A", "Ú"],
  ["Ã\u0087", "Ç"], ["Ã\u0082", "Â"], ["Ã\u008A", "Ê"],
  ["Ã\u0094", "Ô"], ["Ã\u0095", "Õ"], ["Ã\u0083", "Ã"],
];

function buildNestedReplace(column: string): string {
  let expr = column;
  for (const [broken, correct] of REPLACEMENTS) {
    // Escape single quotes for SQL
    const b = broken.replace(/'/g, "''");
    const c = correct.replace(/'/g, "''");
    expr = `REPLACE(${expr}, '${b}', '${c}')`;
  }
  return expr;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: Record<string, number> = {};

    // Fix clients fields
    const clientFields = ["nome_cliente", "regiao", "consultor", "tipo_ug", "observacoes_cliente"];
    for (const field of clientFields) {
      const sql = `UPDATE clients SET ${field} = ${buildNestedReplace(field)} WHERE ${field} LIKE '%Ã%'`;
      const { count, error } = await supabase.rpc("exec_sql", { query: sql }).single();
      if (error) {
        // Fallback: use direct fetch approach
        console.log(`RPC not available for ${field}, skipping: ${error.message}`);
      } else {
        results[`clients.${field}`] = count || 0;
      }
    }

    // Fix modules
    {
      const sql = `UPDATE modules SET nome_modulo = ${buildNestedReplace("nome_modulo")} WHERE nome_modulo LIKE '%Ã%'`;
      const { count, error } = await supabase.rpc("exec_sql", { query: sql }).single();
      if (!error) results["modules.nome_modulo"] = count || 0;
    }

    // Fix client_modules
    {
      const sql = `UPDATE client_modules SET observacoes = ${buildNestedReplace("observacoes")} WHERE observacoes LIKE '%Ã%'`;
      const { count, error } = await supabase.rpc("exec_sql", { query: sql }).single();
      if (!error) results["client_modules.observacoes"] = count || 0;
    }

    // If RPC approach didn't work, fall back to individual record updates
    const totalFixed = Object.values(results).reduce((a, b) => a + b, 0);
    
    if (totalFixed === 0 && Object.keys(results).length === 0) {
      // Fallback: use the REST API approach but with batched operations
      let fixed = 0;

      // Process clients
      const { data: clients } = await supabase.from("clients").select("id, nome_cliente, regiao, consultor, tipo_ug, observacoes_cliente").like("nome_cliente", "%Ã%");
      const { data: clients2 } = await supabase.from("clients").select("id, nome_cliente, regiao, consultor, tipo_ug, observacoes_cliente").like("regiao", "%Ã%");
      const { data: clients3 } = await supabase.from("clients").select("id, nome_cliente, regiao, consultor, tipo_ug, observacoes_cliente").like("consultor", "%Ã%");
      
      const allClients = new Map<string, any>();
      for (const list of [clients, clients2, clients3]) {
        if (list) for (const c of list) allClients.set(c.id, c);
      }

      for (const c of allClients.values()) {
        const updates: Record<string, string> = {};
        for (const field of ["nome_cliente", "regiao", "consultor", "tipo_ug", "observacoes_cliente"]) {
          const original = (c as any)[field] || "";
          let cleaned = original;
          for (const [broken, correct] of REPLACEMENTS) {
            cleaned = cleaned.split(broken).join(correct);
          }
          if (cleaned !== original) updates[field] = cleaned.trim();
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from("clients").update(updates).eq("id", c.id);
          fixed++;
        }
      }

      // Process modules
      const { data: modules } = await supabase.from("modules").select("id, nome_modulo").like("nome_modulo", "%Ã%");
      if (modules) {
        for (const m of modules) {
          let cleaned = m.nome_modulo || "";
          for (const [broken, correct] of REPLACEMENTS) {
            cleaned = cleaned.split(broken).join(correct);
          }
          if (cleaned !== m.nome_modulo) {
            await supabase.from("modules").update({ nome_modulo: cleaned.trim() }).eq("id", m.id);
            fixed++;
          }
        }
      }

      // Process client_modules
      const { data: cms } = await supabase.from("client_modules").select("id, observacoes").like("observacoes", "%Ã%");
      if (cms) {
        for (const cm of cms) {
          let cleaned = cm.observacoes || "";
          for (const [broken, correct] of REPLACEMENTS) {
            cleaned = cleaned.split(broken).join(correct);
          }
          if (cleaned !== (cm.observacoes || "")) {
            await supabase.from("client_modules").update({ observacoes: cleaned.trim() }).eq("id", cm.id);
            fixed++;
          }
        }
      }

      return new Response(JSON.stringify({ success: true, fixed, method: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, results, totalFixed, method: "sql" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
