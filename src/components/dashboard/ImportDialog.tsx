import { useState, useCallback, useRef } from "react";
import ExcelJS from "exceljs";
import { z } from "zod";
import { ContractRow } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileUp, CheckCircle, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractCellValue = (val: any): unknown => {
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && val !== null) {
    if ("result" in val) return val.result;
    if ("richText" in val) return val.richText.map((rt: any) => rt.text).join("");
    if ("error" in val) return "";
  }
  return val;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 10000;
const VALID_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "", // Some browsers don't set MIME for CSV
];

const ContractSchema = z.object({
  clientName: z.string().min(1).max(200),
  ugType: z.string().max(100),
  product: z.string().min(1).max(200),
  contractedValue: z.number().min(0).max(999999999),
  billedValue: z.number().min(0).max(999999999),
  signatureDate: z.string().max(20),
  expirationDate: z.string().max(20),
  billed: z.boolean(),
  contractStatus: z.string().max(50),
  observations: z.string().max(500),
  regiao: z.string().max(100),
  consultor: z.string().max(100),
});

const REQUIRED_FIELDS: { key: keyof Omit<ContractRow, "id">; label: string; optional?: boolean }[] = [
  { key: "clientName", label: "Nome do Cliente" },
  { key: "ugType", label: "Tipo de UG" },
  { key: "product", label: "Produto" },
  { key: "contractedValue", label: "Valor Contratado" },
  { key: "billedValue", label: "Valor Faturado" },
  { key: "signatureDate", label: "Data de Assinatura" },
  { key: "expirationDate", label: "Vencimento do Contrato" },
  { key: "billed", label: "Faturado?" },
  { key: "contractStatus", label: "Status do Contrato" },
  { key: "observations", label: "Observações" },
  { key: "regiao", label: "Região", optional: true },
  { key: "consultor", label: "Consultor", optional: true },
];

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ContractRow[]) => void;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setStep("upload");
    setFileName("");
  };

  const handleFile = useCallback((file: File) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Tamanho máximo: 10MB");
      return;
    }

    if (file.type && !VALID_MIME_TYPES.includes(file.type)) {
      toast.error("Tipo de arquivo inválido. Use .xlsx, .xls ou .csv");
      return;
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      toast.error("Formato não suportado. Use .xlsx, .xls ou .csv");
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        const ext = file.name.toLowerCase();

        if (ext.endsWith(".csv")) {
          const text = new TextDecoder().decode(buffer);
          const lines = text.split("\n");
          // Parse CSV manually into worksheet
          const csvWorkbook = new ExcelJS.Workbook();
          const csvSheet = csvWorkbook.addWorksheet("CSV");
          lines.forEach((line) => {
            const cells = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
            csvSheet.addRow(cells);
          });
          workbook.addWorksheet("Data");
          const targetSheet = workbook.getWorksheet("Data")!;
          csvSheet.eachRow((row, rowNumber) => {
            const targetRow = targetSheet.getRow(rowNumber);
            row.eachCell((cell, colNumber) => {
              targetRow.getCell(colNumber).value = cell.value;
            });
            targetRow.commit();
          });
        } else {
          await workbook.xlsx.load(buffer);
        }

        const sheet = workbook.worksheets[0];
        if (!sheet || sheet.rowCount < 2) {
          toast.error("Planilha vazia");
          return;
        }

        // Extract headers from first row
        const headerRow = sheet.getRow(1);
        const cols: { name: string; colNumber: number }[] = [];
        headerRow.eachCell((cell, colNumber) => {
          const val = String(extractCellValue(cell.value) ?? "").trim();
          if (val) cols.push({ name: val, colNumber });
        });

        if (cols.length === 0) {
          toast.error("Nenhum cabeçalho encontrado");
          return;
        }

        // Extract data rows
        const json: Record<string, unknown>[] = [];
        for (let r = 2; r <= sheet.rowCount; r++) {
          if (json.length >= MAX_ROWS) {
            toast.error(`Arquivo excede o limite de ${MAX_ROWS.toLocaleString("pt-BR")} linhas`);
            return;
          }
          const row = sheet.getRow(r);
          const obj: Record<string, unknown> = {};
          let hasData = false;
          cols.forEach((col) => {
            const cell = row.getCell(col.colNumber);
            const val = extractCellValue(cell.value);
            obj[col.name] = val ?? "";
            if (val !== null && val !== undefined && val !== "") hasData = true;
          });
          if (hasData) json.push(obj);
        }

        if (json.length === 0) {
          toast.error("Planilha vazia");
          return;
        }

        setHeaders(cols);
        setRawRows(json);

        // Auto-map by similarity
        const autoMap: Record<string, string> = {};
        REQUIRED_FIELDS.forEach((field) => {
          const match = cols.find((col) => {
            const c = col.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const l = field.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return c.includes(l) || l.includes(c) || c === field.key.toLowerCase();
          });
          if (match) autoMap[field.key] = match;
        });
        setMapping(autoMap);
        setStep("map");
      } catch {
        toast.error("Erro ao ler o arquivo");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const allMapped = REQUIRED_FIELDS.filter((f) => f.key !== "observations" && !f.optional).every((f) => mapping[f.key]);

  const parseCurrency = (val: unknown): number => {
    // Fallback: extract result from formula objects that slipped through
    if (typeof val === "object" && val !== null && "result" in (val as Record<string, unknown>)) {
      val = (val as Record<string, unknown>).result;
    }
    if (typeof val === "number") return val;
    if (val === null || val === undefined || val === "") return 0;
    const str = String(val).replace(/[R$\s.]/g, "").replace(",", ".");
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const parseDate = (val: unknown): string => {
    if (!val) return "";
    // ExcelJS returns Date objects for date cells
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const d = String(val.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    // Excel serial number
    if (typeof val === "number") {
      const epoch = new Date(1899, 11, 30);
      const date = new Date(epoch.getTime() + val * 86400000);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    const str = String(val).trim();
    // DD/MM/YYYY
    const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) return `${brMatch[3]}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`;
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
    return str;
  };

  const parseBool = (val: unknown): boolean => {
    const s = String(val).toLowerCase().trim();
    return s === "sim" || s === "yes" || s === "true" || s === "1" || s === "s";
  };

  const handleConfirm = () => {
    // Debug: log first 3 rows raw values for mapped fields
    rawRows.slice(0, 3).forEach((row, i) => {
      console.log(`[ImportDebug] Row ${i}:`, {
        contractedValue_raw: row[mapping.contractedValue],
        contractedValue_type: typeof row[mapping.contractedValue],
        billedValue_raw: row[mapping.billedValue],
        billedValue_type: typeof row[mapping.billedValue],
        contractedValue_parsed: parseCurrency(row[mapping.contractedValue]),
        billedValue_parsed: parseCurrency(row[mapping.billedValue]),
      });
    });

    const contracts: ContractRow[] = rawRows.map((row, i) => ({
      id: String(i + 1),
      clientName: String(row[mapping.clientName] ?? "").trim().substring(0, 200),
      ugType: String(row[mapping.ugType] ?? "").trim().substring(0, 100),
      product: String(row[mapping.product] ?? "").trim().substring(0, 200),
      contractedValue: parseCurrency(row[mapping.contractedValue]),
      billedValue: parseCurrency(row[mapping.billedValue]),
      signatureDate: parseDate(row[mapping.signatureDate]),
      expirationDate: parseDate(row[mapping.expirationDate]),
      billed: parseBool(row[mapping.billed]),
      contractStatus: String(row[mapping.contractStatus] ?? "").trim().substring(0, 50),
      observations: String(row[mapping.observations] ?? "").trim().substring(0, 500),
      regiao: mapping.regiao ? String(row[mapping.regiao] ?? "").trim().substring(0, 100) : "",
      consultor: mapping.consultor ? String(row[mapping.consultor] ?? "").trim().substring(0, 100) : "",
    }));

    const valid = contracts.filter((c) => {
      const result = ContractSchema.safeParse(c);
      return result.success;
    });

    if (valid.length === 0) {
      toast.error("Nenhum registro válido encontrado");
      return;
    }

    const skipped = contracts.length - valid.length;
    if (skipped > 0) {
      toast.warning(`${skipped} registro(s) ignorado(s) por dados inválidos`);
    }

    onImport(valid);
    toast.success(`${valid.length} registros importados com sucesso!`);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Planilha
          </DialogTitle>
          <DialogDescription>
            Importe dados de contratos a partir de um arquivo XLSX ou CSV.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border/70 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <FileUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste seu arquivo aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground mt-1">Formatos: .xlsx, .xls, .csv</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-success" />
              <span>{fileName} — {rawRows.length} linhas encontradas, {headers.length} colunas</span>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Mapeie as colunas da planilha:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REQUIRED_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {field.label}
                      {field.key !== "observations" && !field.optional && <span className="text-danger ml-0.5">*</span>}
                    </Label>
                    <Select
                      value={mapping[field.key] || "unmapped"}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [field.key]: v === "unmapped" ? "" : v }))}
                    >
                      <SelectTrigger className="h-8 text-xs bg-muted/50 border-border/50">
                        <SelectValue placeholder="Selecionar coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmapped">— Não mapeado —</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {!allMapped && (
              <div className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5" />
                Mapeie todos os campos obrigatórios para continuar
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={reset}>Voltar</Button>
              <Button size="sm" disabled={!allMapped} onClick={handleConfirm} className="gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Importar {rawRows.length} registros
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
