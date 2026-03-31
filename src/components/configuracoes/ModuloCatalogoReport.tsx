import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";

interface Module {
  id: string;
  nome_modulo: string;
  categoria_modulo: string | null;
  descricao: string | null;
  status_modulo: string | null;
}

interface ModuloCatalogoReportProps {
  modules: Module[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
          <Button variant="outline" size="sm" className="gap-2 text-xs print:hidden" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Exportar PDF
          </Button>
        </DialogHeader>

        <div className="text-xs text-muted-foreground mb-2 print:text-black">
          {sorted.length} módulo{sorted.length !== 1 ? "s" : ""} cadastrado{sorted.length !== 1 ? "s" : ""}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Nome do Módulo</TableHead>
              <TableHead className="text-xs">Categoria</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs font-medium">{m.nome_modulo}</TableCell>
                <TableCell className="text-xs">{m.categoria_modulo || "—"}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant={m.status_modulo === "Ativo" ? "default" : "destructive"}>
                    {m.status_modulo ?? "Ativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.descricao || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="text-xs font-semibold">
                Total: {sorted.length} módulo{sorted.length !== 1 ? "s" : ""}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
