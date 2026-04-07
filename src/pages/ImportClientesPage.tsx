import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, Loader2, Search } from "lucide-react";
import { normalizeForSearch } from "@/utils/textUtils";
import { useAuditLog } from "@/hooks/useAuditLog";
import * as XLSX from "xlsx";

interface DbClient {
  id: string;
  codigo_cliente: number;
  codigo_bling: string;
  nome_cliente: string;
  nome_fantasia: string;
  cnpj: string;
  fone: string;
  celular: string;
  email: string;
  email_nfse: string;
  observacoes_cliente: string;
  cliente_desde: string | null;
}

interface SpreadsheetRow {
  codigo: number | null;
  cod_bling: string;
  nome: string;
  fantasia: string;
  fone: string;
  celular: string;
  email: string;
  cnpj: string;
  observacoes: string;
  email_nfse: string;
  cliente_desde: string;
  rowIndex: number;
}

type ActionType = "atualizar" | "criar" | "divergencia" | "ignorar";

interface AuditRow {
  row: SpreadsheetRow;
  action: ActionType;
  matchedClient: DbClient | null;
  divergence: string;
  userAction: ActionType;
}

function normalizeCnpj(v: string): string {
  return (v || "").replace(/\D/g, "");
}

function parseDate(v: string): string {
  if (!v) return "";
  // Try ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  // dd/mm/yyyy
  const dmy = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  // JS Date string
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return "";
}

function similarity(a: string, b: string): number {
  const na = normalizeForSearch(a);
  const nb = normalizeForSearch(b);
  if (na === nb) return 1;
  if (!na || !nb) return 0;
  const longer = na.length > nb.length ? na : nb;
  const shorter = na.length > nb.length ? nb : na;
  if (longer.includes(shorter)) return shorter.length / longer.length;
  let matches = 0;
  const words1 = na.split(/\s+/);
  const words2 = nb.split(/\s+/);
  for (const w of words1) {
    if (words2.some(w2 => w2 === w || w2.includes(w) || w.includes(w2))) matches++;
  }
  return matches / Math.max(words1.length, words2.length);
}

function mergeObservacoes(existing: string, imported: string): string {
  const ex = (existing || "").trim();
  const im = (imported || "").trim();
  if (!im) return ex;
  if (!ex) return im;
  const today = new Date().toISOString().slice(0, 10);
  return `${ex}\n\n[Importação Bling — ${today}]\n${im}`;
}

export default function ImportClientesPage() {
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [step, setStep] = useState<"upload" | "audit" | "processing" | "done">("upload");
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [dbClients, setDbClients] = useState<DbClient[]>([]);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState({ updated: 0, created: 0, skipped: 0, errors: 0, total: 0 });
  const [fileName, setFileName] = useState("");

  // Load db clients
  useEffect(() => {
    supabase.from("clients").select("id, codigo_cliente, codigo_bling, nome_cliente, nome_fantasia, cnpj, fone, celular, email, email_nfse, observacoes_cliente, cliente_desde")
      .then(({ data }) => {
        if (data) setDbClients(data as DbClient[]);
      });
  }, []);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

        const parsed: SpreadsheetRow[] = json.map((r: any, i: number) => {
          const keys = Object.keys(r);
          return {
            codigo: r[keys[0]] ? parseInt(String(r[keys[0]])) || null : null,
            cod_bling: String(r[keys[1]] || "").trim(),
            nome: String(r[keys[2]] || "").trim(),
            fantasia: String(r[keys[3]] || "").trim(),
            fone: String(r[keys[4]] || "").trim(),
            celular: String(r[keys[5]] || "").trim(),
            email: String(r[keys[6]] || "").trim(),
            cnpj: String(r[keys[7]] || "").trim(),
            observacoes: String(r[keys[8]] || "").trim().replace(/<br\/?>/gi, "\n"),
            email_nfse: String(r[keys[9]] || "").trim(),
            cliente_desde: String(r[keys[10]] || "").trim(),
            rowIndex: i + 2,
          };
        }).filter((r: SpreadsheetRow) => r.nome);

        setRows(parsed);
        runMatching(parsed);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao ler arquivo");
      }
    };
    reader.readAsArrayBuffer(file);
  }, [dbClients]);

  const runMatching = useCallback((parsedRows: SpreadsheetRow[]) => {
    const byCode = new Map<number, DbClient>();
    const byBling = new Map<string, DbClient>();
    const byCnpj = new Map<string, DbClient>();
    const byName = new Map<string, DbClient>();

    for (const c of dbClients) {
      byCode.set(c.codigo_cliente, c);
      if (c.codigo_bling) byBling.set(c.codigo_bling.trim(), c);
      const cn = normalizeCnpj(c.cnpj);
      if (cn.length >= 11) byCnpj.set(cn, c);
      byName.set(normalizeForSearch(c.nome_cliente), c);
    }

    const results: AuditRow[] = parsedRows.map((row) => {
      let match: DbClient | null = null;
      let divergence = "";
      let action: ActionType = "criar";

      // 1. Match by codigo_cliente
      if (row.codigo !== null && byCode.has(row.codigo)) {
        match = byCode.get(row.codigo)!;
        const sim = similarity(row.nome, match.nome_cliente);
        if (sim < 0.35) {
          divergence = `Código ${row.codigo} existe como "${match.nome_cliente}" mas planilha traz "${row.nome}" (similaridade: ${(sim * 100).toFixed(0)}%)`;
          action = "divergencia";
        } else {
          action = "atualizar";
        }
      }

      // 2. Match by Bling code
      if (!match && row.cod_bling && byBling.has(row.cod_bling)) {
        match = byBling.get(row.cod_bling)!;
        if (row.codigo !== null && row.codigo !== match.codigo_cliente) {
          divergence = `Cod Bling ${row.cod_bling} vinculado a "${match.nome_cliente}" (código ${match.codigo_cliente}), mas planilha traz código ${row.codigo}`;
          action = "divergencia";
        } else {
          action = "atualizar";
        }
      }

      // 3. Match by CNPJ
      if (!match) {
        const cn = normalizeCnpj(row.cnpj);
        if (cn.length >= 11 && byCnpj.has(cn)) {
          match = byCnpj.get(cn)!;
          if (row.codigo !== null && row.codigo !== match.codigo_cliente) {
            divergence = `CNPJ ${row.cnpj} vinculado a "${match.nome_cliente}" (código ${match.codigo_cliente}), mas planilha traz código ${row.codigo}`;
            action = "divergencia";
          } else {
            action = "atualizar";
          }
        }
      }

      // 4. Match by name
      if (!match) {
        const norm = normalizeForSearch(row.nome);
        if (byName.has(norm)) {
          match = byName.get(norm)!;
          const cnRow = normalizeCnpj(row.cnpj);
          const cnDb = normalizeCnpj(match.cnpj);
          if (cnRow && cnDb && cnRow !== cnDb) {
            divergence = `Nome similar "${match.nome_cliente}" mas CNPJ diferente (banco: ${match.cnpj}, planilha: ${row.cnpj})`;
            action = "divergencia";
          } else {
            action = "atualizar";
          }
        }
      }

      return { row, action, matchedClient: match, divergence, userAction: action };
    });

    setAuditRows(results);
    setStep("audit");
  }, [dbClients]);

  const filteredAudit = useMemo(() => {
    return auditRows.filter(r => {
      if (filterAction !== "all" && r.userAction !== filterAction) return false;
      if (search) {
        const term = normalizeForSearch(search);
        const fields = [r.row.nome, r.row.cnpj, r.row.cod_bling, r.matchedClient?.nome_cliente || ""].map(normalizeForSearch);
        if (!fields.some(f => f.includes(term))) return false;
      }
      return true;
    });
  }, [auditRows, filterAction, search]);

  const counts = useMemo(() => {
    const c = { atualizar: 0, criar: 0, divergencia: 0, ignorar: 0 };
    auditRows.forEach(r => c[r.userAction]++);
    return c;
  }, [auditRows]);

  const setUserAction = (idx: number, action: ActionType) => {
    setAuditRows(prev => prev.map((r, i) => i === idx ? { ...r, userAction: action } : r));
  };

  const handleConfirm = async () => {
    const toProcess = auditRows.filter(r => r.userAction === "atualizar" || r.userAction === "criar");
    if (toProcess.length === 0) {
      toast.warning("Nenhuma linha para processar");
      return;
    }
    setStep("processing");
    const result = { updated: 0, created: 0, skipped: 0, errors: 0, total: toProcess.length };
    setProgress({ ...result });

    for (const item of toProcess) {
      try {
        if (item.userAction === "atualizar" && item.matchedClient) {
          const payload: Record<string, any> = {};
          const r = item.row;
          const c = item.matchedClient;

          if (r.cod_bling && r.cod_bling !== c.codigo_bling) payload.codigo_bling = r.cod_bling;
          if (r.fantasia && !c.nome_fantasia) payload.nome_fantasia = r.fantasia;
          if (r.fone && !c.fone) payload.fone = r.fone;
          if (r.celular && !c.celular) payload.celular = r.celular;
          if (r.email && !c.email) payload.email = r.email;
          if (r.cnpj && !c.cnpj) payload.cnpj = r.cnpj;
          if (r.email_nfse && !c.email_nfse) payload.email_nfse = r.email_nfse;
          if (r.cliente_desde) {
            const parsed = parseDate(r.cliente_desde);
            if (parsed && !c.cliente_desde) payload.cliente_desde = parsed;
          }

          // Merge observations
          const mergedObs = mergeObservacoes(c.observacoes_cliente, r.observacoes);
          if (mergedObs !== (c.observacoes_cliente || "").trim()) {
            payload.observacoes_cliente = mergedObs;
          }

          // Always update nome if spreadsheet has it (enrich)
          if (r.nome && !c.nome_cliente) payload.nome_cliente = r.nome;

          if (Object.keys(payload).length > 0) {
            const { error } = await supabase.from("clients").update(payload).eq("id", c.id);
            if (error) throw error;
            await logAction("import_update", "client", c.id, { source: fileName, fields: Object.keys(payload) });
          }
          result.updated++;
        } else if (item.userAction === "criar") {
          const r = item.row;
          const payload: Record<string, any> = {
            nome_cliente: r.nome,
            nome_fantasia: r.fantasia || "",
            codigo_bling: r.cod_bling || "",
            cnpj: r.cnpj || "",
            fone: r.fone || "",
            celular: r.celular || "",
            email: r.email || "",
            email_nfse: r.email_nfse || "",
            observacoes_cliente: r.observacoes || "",
          };
          if (r.cliente_desde) {
            const parsed = parseDate(r.cliente_desde);
            if (parsed) payload.cliente_desde = parsed;
          }
          // Let DB auto-generate codigo_cliente
          const { error } = await supabase.from("clients").insert(payload);
          if (error) throw error;
          await logAction("import_create", "client", undefined, { source: fileName, nome: r.nome });
          result.created++;
        }
      } catch (err) {
        console.error("Import error:", err);
        result.errors++;
      }
      result.skipped = result.total - result.updated - result.created - result.errors;
      setProgress({ ...result });
    }

    const ignored = auditRows.filter(r => r.userAction === "ignorar" || r.userAction === "divergencia").length;
    result.skipped = ignored;
    setProgress({ ...result });
    await logAction("import_complete", "import", undefined, {
      source: fileName,
      total: auditRows.length,
      updated: result.updated,
      created: result.created,
      errors: result.errors,
      ignored,
    });
    setStep("done");
  };

  const actionBadge = (action: ActionType) => {
    switch (action) {
      case "atualizar": return <Badge variant="outline" className="text-[10px] bg-info/10 text-info border-info/30">Atualizar</Badge>;
      case "criar": return <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">Criar</Badge>;
      case "divergencia": return <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">Divergência</Badge>;
      case "ignorar": return <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Ignorar</Badge>;
    }
  };

  const headerActions = (
    <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => navigate("/clientes")}>
      <ArrowLeft className="h-3.5 w-3.5" /> Voltar
    </Button>
  );

  return (
    <AppLayout title="Importar Dados Cadastrais" subtitle="Migração de dados do Bling" headerActions={headerActions}>
      <div className="space-y-4">
        {step === "upload" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="bg-muted/50 border-2 border-dashed border-border rounded-xl p-12 text-center max-w-lg w-full">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">Arraste o arquivo CSV ou XLSX, ou clique para selecionar</p>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="max-w-xs mx-auto"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Colunas esperadas: Codigo, Cod Bling, Nome, Fantasia, Fone, Celular, E-mail, CNPJ/CPF, Observações, E-mail NFe, Cliente desde</p>
          </div>
        )}

        {step === "audit" && (
          <>
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">{auditRows.length} linhas lidas do arquivo</span>
              <Badge variant="outline" className="text-[10px] bg-info/10 text-info border-info/30">{counts.atualizar} atualizar</Badge>
              <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">{counts.criar} criar</Badge>
              <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">{counts.divergencia} divergência</Badge>
              <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">{counts.ignorar} ignorar</Badge>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-end">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar nome, CNPJ, Bling..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="h-9 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="atualizar">Atualizar</SelectItem>
                  <SelectItem value="criar">Criar</SelectItem>
                  <SelectItem value="divergencia">Divergência</SelectItem>
                  <SelectItem value="ignorar">Ignorar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Audit table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border/30">
                      <TableHead className="text-xs w-[50px]">Linha</TableHead>
                      <TableHead className="text-xs w-[60px]">Código</TableHead>
                      <TableHead className="text-xs w-[70px]">Bling</TableHead>
                      <TableHead className="text-xs">Nome Planilha</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">CNPJ</TableHead>
                      <TableHead className="text-xs">Cliente no Sistema</TableHead>
                      <TableHead className="text-xs hidden xl:table-cell">Divergência</TableHead>
                      <TableHead className="text-xs w-[130px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudit.map((item, idx) => {
                      const realIdx = auditRows.indexOf(item);
                      return (
                        <TableRow key={idx} className={`border-border/20 ${item.userAction === "divergencia" ? "bg-warning/5" : ""}`}>
                          <TableCell className="text-xs text-muted-foreground">{item.row.rowIndex}</TableCell>
                          <TableCell className="text-xs">{item.row.codigo ?? "—"}</TableCell>
                          <TableCell className="text-xs">{item.row.cod_bling || "—"}</TableCell>
                          <TableCell className="text-xs font-medium">{item.row.nome}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{item.row.cnpj || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.matchedClient ? `#${item.matchedClient.codigo_cliente} ${item.matchedClient.nome_cliente}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-warning hidden xl:table-cell max-w-[200px] truncate" title={item.divergence}>
                            {item.divergence || "—"}
                          </TableCell>
                          <TableCell>
                            <Select value={item.userAction} onValueChange={(v) => setUserAction(realIdx, v as ActionType)}>
                              <SelectTrigger className="h-7 text-[10px] w-[120px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {item.matchedClient && <SelectItem value="atualizar">Atualizar</SelectItem>}
                                <SelectItem value="criar">Criar novo</SelectItem>
                                <SelectItem value="ignorar">Ignorar</SelectItem>
                                {item.divergence && <SelectItem value="divergencia">Divergência</SelectItem>}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="px-4 py-2 border-t border-border/30 text-xs text-muted-foreground">
                {filteredAudit.length} de {auditRows.length} linha(s)
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setStep("upload"); setAuditRows([]); setRows([]); }}>Cancelar</Button>
              <Button size="sm" className="gap-2" onClick={handleConfirm} disabled={counts.atualizar + counts.criar === 0}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirmar Importação ({counts.atualizar + counts.criar} registro(s))
              </Button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm">Processando importação...</p>
            <div className="text-xs text-muted-foreground space-y-1 text-center">
              <p>Atualizados: {progress.updated} | Criados: {progress.created} | Erros: {progress.errors}</p>
              <p>{progress.updated + progress.created + progress.errors} de {progress.total}</p>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <h2 className="text-lg font-semibold">Importação Concluída</h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-2 text-sm max-w-sm w-full">
              <div className="flex justify-between"><span className="text-muted-foreground">Total de linhas</span><span className="font-medium">{auditRows.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Atualizados</span><span className="font-medium text-info">{progress.updated}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Criados</span><span className="font-medium text-success">{progress.created}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ignorados</span><span className="font-medium">{progress.skipped}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Erros</span><span className="font-medium text-destructive">{progress.errors}</span></div>
            </div>
            <Button size="sm" className="gap-2 mt-4" onClick={() => navigate("/clientes")}>
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Clientes
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
