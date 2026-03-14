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

function mapToContractRow(cm: DbClientModule): ContractRow {
  return {
    id: cm.id,
    clientName: cm.clients.nome_cliente,
    ugType: cm.clients.tipo_ug || "",
    product: cm.modules.nome_modulo,
    contractedValue: Number(cm.valor_contratado) || 0,
    billedValue: Number(cm.valor_faturado) || 0,
    signatureDate: cm.data_assinatura || "",
    expirationDate: cm.vencimento_contrato || "",
    billed: cm.faturado_flag,
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
        .order("created_at", { ascending: false });

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

  const importToDatabase = useCallback(async (rows: ContractRow[]) => {
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
      const clientMap = new Map<string, string>(); // name_lower -> id

      for (const [key, row] of uniqueClients) {
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
      const moduleMap = new Map<string, string>(); // name -> id

      for (const moduleName of uniqueModules) {
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
      await supabase.from("client_modules").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert in batches of 100
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
            data_assinatura: row.signatureDate || null,
            vencimento_contrato: row.expirationDate || null,
            faturado_flag: row.billed,
            status_contrato: row.contractStatus || "Ativo",
            observacoes: row.observations || "",
          };
        })
        .filter(Boolean);

      const batchSize = 100;
      let created = 0;
      for (let i = 0; i < payloads.length; i += batchSize) {
        const batch = payloads.slice(i, i + batchSize);
        const { error: insertError } = await supabase.from("client_modules").insert(batch);
        if (insertError) throw insertError;
        created += batch.length;
      }

      toast.success(`Importação concluída: ${created} criados, ${updated} atualizados`);
      await loadFromDatabase();
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Erro ao importar para o banco de dados");
      // Fallback: use in-memory
      setContracts(rows);
      setDataSource("mock");
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
