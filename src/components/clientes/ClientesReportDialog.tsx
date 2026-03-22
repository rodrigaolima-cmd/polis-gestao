import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/contractUtils";
import { Printer } from "lucide-react";

interface ReportRow {
  clientId: string;
  clientName: string;
  moduleName: string;
  valorContratado: number;
  valorFaturado: number;
}

interface ClientesReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredClientIds: string[];
}

export function ClientesReportDialog({ open, onOpenChange, filteredClientIds }: ClientesReportDialogProps) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("client_modules")
          .select("client_id, valor_contratado, valor_faturado, clients(nome_cliente), modules(nome_modulo)")
          .in("client_id", filteredClientIds.length > 0 ? filteredClientIds : ["__none__"]);

        setRows(
          (data || []).map((r: any) => ({
            clientId: r.client_id,
            clientName: r.clients?.nome_cliente || "",
            moduleName: r.modules?.nome_modulo || "",
            valorContratado: Number(r.valor_contratado) || 0,
            valorFaturado: Number(r.valor_faturado) || 0,
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, filteredClientIds]);

  const grouped = useMemo(() => {
    const map = new Map<string, { clientName: string; modules: ReportRow[] }>();
    rows.forEach((r) => {
      const existing = map.get(r.clientId) || { clientName: r.clientName, modules: [] };
      existing.modules.push(r);
      map.set(r.clientId, existing);
    });
    const entries = Array.from(map.values());
    entries.sort((a, b) => a.clientName.localeCompare(b.clientName, "pt-BR"));
    entries.forEach((e) => e.modules.sort((a, b) => a.moduleName.localeCompare(b.moduleName, "pt-BR")));
    return entries;
  }, [rows]);

  const grandTotal = useMemo(() => ({
    contratado: rows.reduce((s, r) => s + r.valorContratado, 0),
    faturado: rows.reduce((s, r) => s + r.valorFaturado, 0),
  }), [rows]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-card border-border print-report">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Relatório Completo de Clientes e Sistemas</span>
            <Button variant="outline" size="sm" className="gap-2 text-xs no-print" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Exportar PDF
            </Button>
          </DialogTitle>
          <DialogDescription>Visão detalhada por cliente e sistema/produto</DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-xs text-muted-foreground py-8">Carregando...</p>
        ) : grouped.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">Nenhum dado encontrado</p>
        ) : (
          <div className="space-y-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead className="text-xs">Cliente / Sistema</TableHead>
                  <TableHead className="text-xs text-right">Contratado</TableHead>
                  <TableHead className="text-xs text-right">Faturado</TableHead>
                  <TableHead className="text-xs text-right">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((group) => {
                  const subtotalC = group.modules.reduce((s, m) => s + m.valorContratado, 0);
                  const subtotalF = group.modules.reduce((s, m) => s + m.valorFaturado, 0);
                  const subtotalD = subtotalC - subtotalF;

                  return (
                    <> 
                      <TableRow key={`h-${group.clientName}`} className="bg-muted/30 border-border/20">
                        <TableCell colSpan={4} className="text-xs font-semibold py-2">
                          {group.clientName}
                        </TableCell>
                      </TableRow>
                      {group.modules.map((m, i) => {
                        const diff = m.valorContratado - m.valorFaturado;
                        return (
                          <TableRow key={`${group.clientName}-${i}`} className="border-border/10">
                            <TableCell className="text-xs pl-8">{m.moduleName}</TableCell>
                            <TableCell className="text-xs text-right mono">{formatCurrency(m.valorContratado)}</TableCell>
                            <TableCell className="text-xs text-right mono">{formatCurrency(m.valorFaturado)}</TableCell>
                            <TableCell className={`text-xs text-right mono ${diff > 0 ? "text-warning" : diff < 0 ? "text-danger" : ""}`}>
                              {formatCurrency(diff)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow key={`s-${group.clientName}`} className="border-border/30">
                        <TableCell className="text-xs font-medium pl-8 italic">Subtotal</TableCell>
                        <TableCell className="text-xs text-right mono font-medium">{formatCurrency(subtotalC)}</TableCell>
                        <TableCell className="text-xs text-right mono font-medium">{formatCurrency(subtotalF)}</TableCell>
                        <TableCell className={`text-xs text-right mono font-medium ${subtotalD > 0 ? "text-warning" : subtotalD < 0 ? "text-danger" : ""}`}>
                          {formatCurrency(subtotalD)}
                        </TableCell>
                      </TableRow>
                    </>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="text-xs font-bold">Total Geral</TableCell>
                  <TableCell className="text-xs text-right mono font-bold">{formatCurrency(grandTotal.contratado)}</TableCell>
                  <TableCell className="text-xs text-right mono font-bold">{formatCurrency(grandTotal.faturado)}</TableCell>
                  <TableCell className={`text-xs text-right mono font-bold ${grandTotal.contratado - grandTotal.faturado > 0 ? "text-warning" : ""}`}>
                    {formatCurrency(grandTotal.contratado - grandTotal.faturado)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
