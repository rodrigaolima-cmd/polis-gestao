import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { fixMojibake } from "@/utils/textUtils";
import { Printer } from "lucide-react";

interface Row {
  id: string;
  nome_cliente: string;
  nome_fantasia: string;
  email: string;
  email_nfse: string;
  regiao: string;
  consultor: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredClientIds: string[];
}

export function RelacaoCadastralDialog({ open, onOpenChange, filteredClientIds }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        if (filteredClientIds.length === 0) {
          setRows([]);
          return;
        }
        const { data } = await supabase
          .from("clients")
          .select("id,nome_cliente,nome_fantasia,email,email_nfse,regiao,consultor")
          .in("id", filteredClientIds);
        const mapped: Row[] = (data || []).map((c: any) => ({
          id: c.id,
          nome_cliente: fixMojibake(c.nome_cliente || ""),
          nome_fantasia: fixMojibake(c.nome_fantasia || ""),
          email: c.email || "",
          email_nfse: c.email_nfse || "",
          regiao: fixMojibake(c.regiao || ""),
          consultor: fixMojibake(c.consultor || ""),
        }));
        mapped.sort((a, b) => a.nome_cliente.localeCompare(b.nome_cliente, "pt-BR", { sensitivity: "base" }));
        setRows(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, filteredClientIds]);

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-card border-border print-report">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Relação Cadastral</span>
            <Button variant="outline" size="sm" className="gap-2 text-xs no-print" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Exportar PDF
            </Button>
          </DialogTitle>
          <DialogDescription>
            Dados cadastrais por cliente — {rows.length} registro(s)
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-xs text-muted-foreground py-8">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">Nenhum cliente encontrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs">Nome Fantasia</TableHead>
                <TableHead className="text-xs">E-mail Principal</TableHead>
                <TableHead className="text-xs">E-mail NFSe</TableHead>
                <TableHead className="text-xs">Região</TableHead>
                <TableHead className="text-xs">Consultor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="border-border/10">
                  <TableCell className="text-xs font-medium">{r.nome_cliente}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.nome_fantasia || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground break-all">{r.email || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground break-all">{r.email_nfse || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.regiao || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.consultor || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
