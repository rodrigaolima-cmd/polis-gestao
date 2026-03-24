import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ContractRow } from "@/types/contract";
import { mockContracts } from "@/data/mockContracts";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { normalizeText } from "@/utils/textUtils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const OP_TIMEOUT = 15000; // 15s per operation

interface DbClient {
  id: string;
  nome_cliente: string;
  tipo_ug: string;
  regiao: string;
  consultor: string;
  status_cliente: string;
  observacoes_cliente: string;
}

interface DbModule {
  id: string;
  nome_modulo: string;
}

interface DbClientModule {
  id: string;
  client_id: string;
  modulo_id: string;
  valor_contratado: number;
  valor_faturado: number;
  data_assinatura: string | null;
  vencimento_contrato: string | null;
  faturado_flag: boolean;
  status_contrato: string;
  observacoes: string;
  ativo_no_cliente: boolean;
  clients: DbClient;
  modules: DbModule;
}

function sanitizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(trimmed + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return trimmed;
}

function mapToContractRow(cm: DbClientModule): ContractRow {
  const isInactive = cm.ativo_no_cliente === false;
  return {
    id: cm.id,
    clientName: cm.clients.nome_cliente,
    ugType: cm.clients.tipo_ug || "",
    product: cm.modules.nome_modulo,
    contractedValue: Number(cm.valor_contratado) || 0,
    billedValue: isInactive ? 0 : (Number(cm.valor_faturado) || 0),
    signatureDate: cm.data_assinatura || "",
    expirationDate: cm.vencimento_contrato || "",
    billed: isInactive ? false : cm.faturado_flag,
    contractStatus: cm.status_contrato || "",
    observations: cm.observacoes || "",
    regiao: cm.clients.regiao || "",
    consultor: cm.clients.consultor || "",
  };
}

// Lock-free REST helpers that bypass supabase client auth lock
async function restSelect(token: string, table: string, query: string, signal: AbortSignal) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
  });
  if (!res.ok) throw new Error(`SELECT ${table} failed: ${res.status}`);
  return res.json();
}

async function restInsert(token: string, table: string, body: unknown, signal: AbortSignal, returnData = false) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    Prefer: returnData ? "return=representation" : "return=minimal",
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`INSERT ${table} failed: ${res.status} ${text}`);
  }
  return returnData ? res.json() : null;
}

async function restUpdate(token: string, table: string, query: string, body: unknown, signal: AbortSignal) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`UPDATE ${table} failed: ${res.status}`);
}

async function restDelete(token: string, table: string, query: string, signal: AbortSignal) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      Prefer: "return=minimal",
    },
    signal,
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status}`);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

export function useContracts() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"mock" | "database">("mock");
  const { accessToken } = useAuth();

  const loadFromDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_modules")
        .select("*, clients(*), modules(*)")
        .order("created_at", { ascending: false })
        .range(0, 9999);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = (data as unknown as DbClientModule[]).map(mapToContractRow);
        setContracts(mapped);
        setDataSource("database");
      } else {
        setContracts(mockContracts);
        setDataSource("mock");
      }
    } catch (err) {
      console.error("Error loading contracts:", err);
      setContracts(mockContracts);
      setDataSource("mock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromDatabase();
  }, [loadFromDatabase]);

  const importToDatabase = useCallback(async (
    rows: ContractRow[],
    onProgress?: (stage: string, percent: number) => void
  ) => {
    // Get token - prefer context, fallback to session
    let token = accessToken;
    if (!token) {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 3000, "getSession");
        token = data?.session?.access_token ?? null;
      } catch {
        // ignore - will fail on first REST call
      }
    }
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      return { created: 0, failed: rows.length };
    }

    setLoading(true);
    const controller = new AbortController();
    const { signal } = controller;

    try {
      onProgress?.("Preparando importação...", 1);

      // 1. Collect unique clients and modules
      const uniqueClients = new Map<string, ContractRow>();
      const uniqueModules = new Set<string>();
      rows.forEach((r) => {
        const key = r.clientName.trim().toLowerCase();
        if (!uniqueClients.has(key)) uniqueClients.set(key, r);
        if (r.product.trim()) uniqueModules.add(r.product.trim());
      });

      // 2. Find or create clients
      const clientMap = new Map<string, string>();
      let clientIdx = 0;
      const totalClients = uniqueClients.size;

      for (const [key, row] of uniqueClients) {
        clientIdx++;
        onProgress?.(`Processando clientes... ${clientIdx}/${totalClients}`, Math.round((clientIdx / totalClients) * 30));

        const existing = await withTimeout(
          restSelect(token, "clients", `nome_cliente=ilike.${encodeURIComponent(row.clientName.trim())}&select=id&limit=1`, signal),
          OP_TIMEOUT, `client lookup ${clientIdx}`
        );

        if (existing && existing.length > 0) {
          clientMap.set(key, existing[0].id);
          await withTimeout(
            restUpdate(token, "clients", `id=eq.${existing[0].id}`, {
              tipo_ug: row.ugType || undefined,
              regiao: row.regiao || undefined,
              consultor: row.consultor || undefined,
            }, signal),
            OP_TIMEOUT, `client update ${clientIdx}`
          );
        } else {
          const created = await withTimeout(
            restInsert(token, "clients", {
              nome_cliente: normalizeText(row.clientName.trim()),
              tipo_ug: normalizeText(row.ugType || ""),
              regiao: normalizeText(row.regiao || ""),
              consultor: normalizeText(row.consultor || ""),
            }, signal, true),
            OP_TIMEOUT, `client insert ${clientIdx}`
          );
          clientMap.set(key, created[0].id);
        }
      }

      // 3. Find or create modules
      const moduleMap = new Map<string, string>();
      let modIdx = 0;
      const totalMods = uniqueModules.size;

      for (const moduleName of uniqueModules) {
        modIdx++;
        onProgress?.(`Processando módulos... ${modIdx}/${totalMods}`, 30 + Math.round((modIdx / totalMods) * 20));

        const existing = await withTimeout(
          restSelect(token, "modules", `nome_modulo=ilike.${encodeURIComponent(moduleName)}&select=id&limit=1`, signal),
          OP_TIMEOUT, `module lookup ${modIdx}`
        );

        if (existing && existing.length > 0) {
          moduleMap.set(moduleName.toLowerCase(), existing[0].id);
        } else {
          const created = await withTimeout(
            restInsert(token, "modules", { nome_modulo: moduleName }, signal, true),
            OP_TIMEOUT, `module insert ${modIdx}`
          );
          moduleMap.set(moduleName.toLowerCase(), created[0].id);
        }
      }

      // 4. Clear existing and insert fresh
      onProgress?.("Limpando dados anteriores...", 52);
      await withTimeout(
        restDelete(token, "client_modules", "id=neq.00000000-0000-0000-0000-000000000000", signal),
        OP_TIMEOUT, "delete old modules"
      );

      const payloads = rows
        .map((row) => {
          const clientId = clientMap.get(row.clientName.trim().toLowerCase());
          const moduleId = moduleMap.get(row.product.trim().toLowerCase());
          if (!clientId || !moduleId) return null;
          return {
            client_id: clientId,
            modulo_id: moduleId,
            valor_contratado: row.contractedValue,
            valor_faturado: row.billedValue,
            data_assinatura: sanitizeDate(row.signatureDate),
            vencimento_contrato: sanitizeDate(row.expirationDate),
            faturado_flag: row.billed,
            status_contrato: row.contractStatus || "Ativo",
            observacoes: row.observations || "",
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const batchSize = 100;
      let created = 0;
      let failed = 0;
      const totalBatches = Math.ceil(payloads.length / batchSize);

      for (let i = 0; i < payloads.length; i += batchSize) {
        const batchNum = Math.floor(i / batchSize) + 1;
        onProgress?.(`Inserindo contratos... lote ${batchNum}/${totalBatches}`, 55 + Math.round((batchNum / totalBatches) * 40));
        const batch = payloads.slice(i, i + batchSize);
        try {
          await withTimeout(
            restInsert(token, "client_modules", batch, signal, false),
            OP_TIMEOUT, `batch ${batchNum}`
          );
          created += batch.length;
        } catch (batchErr) {
          console.warn(`Batch ${batchNum} failed, inserting individually...`, batchErr);
          for (const record of batch) {
            try {
              await restInsert(token, "client_modules", record, signal, false);
              created++;
            } catch {
              failed++;
            }
          }
        }
      }

      onProgress?.("Finalizando...", 98);
      if (failed > 0) {
        toast.warning(`Importação concluída: ${created} importados, ${failed} falharam`);
      } else {
        toast.success(`Importação concluída: ${created} registros importados`);
      }
      await loadFromDatabase();
      return { created, failed };
    } catch (err: any) {
      console.error("Import error:", err);
      const msg = err?.message?.startsWith("Timeout:")
        ? "Importação travou (timeout). Tente novamente."
        : "Erro ao importar para o banco de dados";
      toast.error(msg);
      controller.abort();
      setContracts(rows);
      setDataSource("mock");
      return { created: 0, failed: rows.length };
    } finally {
      setLoading(false);
    }
  }, [loadFromDatabase, accessToken]);

  const resetToMock = useCallback(() => {
    setContracts(mockContracts);
    setDataSource("mock");
  }, []);

  return {
    contracts,
    setContracts,
    loading,
    dataSource,
    importToDatabase,
    loadFromDatabase,
    resetToMock,
  };
}
