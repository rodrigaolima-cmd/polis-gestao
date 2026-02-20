import { ContractRow } from "@/types/contract";
import { formatCurrency, formatDate } from "@/utils/contractUtils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ChartReportDialogProps {
  title: string;
  contracts: ContractRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChartReportDialog({ title, contracts, open, onOpenChange }: ChartReportDialogProps) {
  const totalContracted = contracts.reduce((s, c) => s + c.contractedValue, 0);
  const totalBilled = contracts.reduce((s, c) => s + c.billedValue, 0);
  const totalDifference = totalContracted - totalBilled;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[85vh] overflow-y-auto print-report">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <Button variant="outline" size="sm" className="gap-2 text-xs print:hidden" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" /> Exportar PDF
          </Button>
        </DialogHeader>

        <div className="text-xs text-muted-foreground mb-2 print:text-black">
          {contracts.length} contrato{contracts.length !== 1 ? "s" : ""} encontrado{contracts.length !== 1 ? "s" : ""}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Cliente</TableHead>
              <TableHead className="text-xs">Tipo UG</TableHead>
              <TableHead className="text-xs">Produto</TableHead>
              <TableHead className="text-xs text-right">Contratado</TableHead>
              <TableHead className="text-xs text-right">Faturado</TableHead>
              <TableHead className="text-xs text-right">Diferença</TableHead>
              <TableHead className="text-xs">Assinatura</TableHead>
              <TableHead className="text-xs">Vencimento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-xs font-medium">{c.clientName}</TableCell>
                <TableCell className="text-xs">{c.ugType}</TableCell>
                <TableCell className="text-xs">{c.product}</TableCell>
                <TableCell className="text-xs text-right mono">{formatCurrency(c.contractedValue)}</TableCell>
                <TableCell className="text-xs text-right mono">{formatCurrency(c.billedValue)}</TableCell>
                <TableCell className="text-xs text-right mono">{formatCurrency(c.contractedValue - c.billedValue)}</TableCell>
                <TableCell className="text-xs">{formatDate(c.signatureDate)}</TableCell>
                <TableCell className="text-xs">{formatDate(c.expirationDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-xs font-semibold">Totais</TableCell>
              <TableCell className="text-xs text-right font-semibold mono">{formatCurrency(totalContracted)}</TableCell>
              <TableCell className="text-xs text-right font-semibold mono">{formatCurrency(totalBilled)}</TableCell>
              <TableCell className="text-xs text-right font-semibold mono">{formatCurrency(totalDifference)}</TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
