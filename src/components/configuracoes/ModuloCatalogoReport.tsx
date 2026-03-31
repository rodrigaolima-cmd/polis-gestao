import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download } from "lucide-react";

interface Module {
  id: string;
  nome_modulo: string;
  categoria_modulo: string | null;
  descricao: string | null;
  status_modulo: string | null;
  created_at?: string;
}

interface ModuloCatalogoReportProps {
  modules: Module[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function exportExcel(modules: Module[]) {
  const header = ["Nome do Módulo", "Categoria", "Status", "Descrição", "Data de Criação"];
  const rows = modules.map((m) => [
    m.nome_modulo,
    m.categoria_modulo || "",
    m.status_modulo ?? "Ativo",
    m.descricao || "",
    m.created_at ? new Date(m.created_at).toLocaleDateString("pt-BR") : "",
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "catalogo_modulos.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ModuloCatalogoReport({ modules, open, onOpenChange }: ModuloCatalogoReportProps) {
  const sorted = [...modules].sort((a, b) =>
    a.nome_modulo.localeCompare(b.nome_modulo, "pt-BR")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[85vh] overflow-y-auto print-report">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle className="text-lg">Relatório do Catálogo de Módulos</DialogTitle>
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => exportExcel(sorted)}>
              <Download className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="text-xs text-muted-foreground mb-2 print:text-black">
          {sorted.length} módulo{sorted.length !== 1 ? "s" : ""} cadastrado{sorted.length !== 1 ? "s" : ""}
          {" · "}Gerado em {new Date().toLocaleDateString("pt-BR")}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Nome do Módulo</TableHead>
              <TableHead className="text-xs">Categoria</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Descrição</TableHead>
              <TableHead className="text-xs">Criação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs font-medium">{m.nome_modulo}</TableCell>
                <TableCell className="text-xs">{m.categoria_modulo || "—"}</TableCell>
                <TableCell className="text-xs">
                  {(m.status_modulo ?? "Ativo") === "Ativo" ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{m.status_modulo ?? "Ativo"}</Badge>
                  ) : (
                    <Badge variant="secondary">{m.status_modulo}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.descricao || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {m.created_at ? new Date(m.created_at).toLocaleDateString("pt-BR") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="text-xs font-semibold">
                Total: {sorted.length} módulo{sorted.length !== 1 ? "s" : ""}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
