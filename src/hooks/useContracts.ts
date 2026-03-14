import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ContractRow } from "@/types/contract";
import { mockContracts } from "@/data/mockContracts";
import { toast } from "sonner";

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
  // Must be YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  // Validate actual date
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

export function useContracts() {
  const [contracts, setContracts] = useState<ContractRow[]>(mockContracts);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"mock" | "database">("mock");

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
    setLoading(true);
    try {
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
        const { data: existing } = await supabase
          .from("clients")
          .select("id")
          .ilike("nome_cliente", row.clientName.trim())
          .limit(1);

        if (existing && existing.length > 0) {
          clientMap.set(key, existing[0].id);
          // Update client info
          await supabase.from("clients").update({
            tipo_ug: row.ugType || undefined,
            regiao: row.regiao || undefined,
            consultor: row.consultor || undefined,
          }).eq("id", existing[0].id);
        } else {
          const { data: created, error } = await supabase
            .from("clients")
            .insert({
              nome_cliente: row.clientName.trim(),
              tipo_ug: row.ugType || "",
              regiao: row.regiao || "",
              consultor: row.consultor || "",
            })
            .select("id")
            .single();

          if (error) throw error;
          clientMap.set(key, created.id);
        }
      }

      // 3. Find or create modules
      const moduleMap = new Map<string, string>();
      let modIdx = 0;
      const totalMods = uniqueModules.size;

      for (const moduleName of uniqueModules) {
        modIdx++;
        onProgress?.(`Processando módulos... ${modIdx}/${totalMods}`, 30 + Math.round((modIdx / totalMods) * 20));
        const { data: existing } = await supabase
          .from("modules")
          .select("id")
          .ilike("nome_modulo", moduleName)
          .limit(1);

        if (existing && existing.length > 0) {
          moduleMap.set(moduleName.toLowerCase(), existing[0].id);
        } else {
          const { data: created, error } = await supabase
            .from("modules")
            .insert({ nome_modulo: moduleName })
            .select("id")
            .single();

          if (error) throw error;
          moduleMap.set(moduleName.toLowerCase(), created.id);
        }
      }

      // 4. Clear existing client_modules and insert all rows fresh
      onProgress?.("Limpando dados anteriores...", 52);
      await supabase.from("client_modules").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert in batches of 100 with resilient error handling
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
        const { error: insertError } = await supabase.from("client_modules").insert(batch as any);
        if (insertError) {
          console.warn(`Batch ${batchNum} failed, inserting individually...`, insertError);
          // Fallback: insert one by one
          for (const record of batch) {
            const { error: singleError } = await supabase.from("client_modules").insert(record as any);
            if (singleError) {
              console.warn("Record failed:", singleError, record);
              failed++;
            } else {
              created++;
            }
          }
        } else {
          created += batch.length;
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
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Erro ao importar para o banco de dados");
      setContracts(rows);
      setDataSource("mock");
      return { created: 0, failed: rows.length };
    } finally {
      setLoading(false);
    }
  }, [loadFromDatabase]);

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
