import { DashboardFilters, ContractRow } from "@/types/contract";
import { getUniqueValues, getUniqueYears } from "@/utils/contractUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

interface FiltersBarProps {
  filters: DashboardFilters;
  contracts: ContractRow[];
  onFilterChange: (filters: DashboardFilters) => void;
  onReset: () => void;
}

export function FiltersBar({ filters, contracts, onFilterChange, onReset }: FiltersBarProps) {
  const [expanded, setExpanded] = useState(false);
  const ugTypes = getUniqueValues(contracts, "ugType");
  const products = getUniqueValues(contracts, "product");
  const statuses = getUniqueValues(contracts, "contractStatus");
  const sigYears = getUniqueYears(contracts, "signatureDate");
  const expYears = getUniqueYears(contracts, "expirationDate");
  const clients = getUniqueValues(contracts, "clientName");

  const update = (partial: Partial<DashboardFilters>) => {
    onFilterChange({ ...filters, ...partial });
  };

  const activeCount = [
    filters.ugType, filters.product, filters.contractStatus,
    filters.signatureYear, filters.expirationYear, filters.client,
  ].filter(Boolean).length
    + (filters.onlyWithDifference ? 1 : 0)
    + (filters.expireInDays !== null ? 1 : 0);

  return (
    <div className="glass-card rounded-xl p-4 space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
      {/* Search + toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente ou produto..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-9 bg-muted/50 border-border/50"
          />
          {filters.search && (
            <button onClick={() => update({ search: "" })} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" /> Limpar
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <FilterSelect label="Tipo de UG" value={filters.ugType} options={ugTypes} onChange={(v) => update({ ugType: v })} />
          <FilterSelect label="Produto" value={filters.product} options={products} onChange={(v) => update({ product: v })} />
          <FilterSelect label="Status" value={filters.contractStatus} options={statuses} onChange={(v) => update({ contractStatus: v })} />
          <FilterSelect label="Ano Assinatura" value={filters.signatureYear} options={sigYears} onChange={(v) => update({ signatureYear: v })} />
          <FilterSelect label="Ano Vencimento" value={filters.expirationYear} options={expYears} onChange={(v) => update({ expirationYear: v })} />
          <FilterSelect label="Cliente" value={filters.client} options={clients} onChange={(v) => update({ client: v })} />

          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
            <Switch
              checked={filters.onlyWithDifference}
              onCheckedChange={(v) => update({ onlyWithDifference: v })}
              id="diff-switch"
            />
            <Label htmlFor="diff-switch" className="text-xs text-muted-foreground">Diferença &gt; 0</Label>
          </div>

          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
            <Select
              value={filters.expireInDays !== null ? String(filters.expireInDays) : "all"}
              onValueChange={(v) => update({ expireInDays: v === "all" ? null : Number(v) })}
            >
              <SelectTrigger className="h-8 text-xs bg-muted/50 border-border/50">
                <SelectValue placeholder="Vencer em..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">180 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
        <SelectTrigger className="h-8 text-xs bg-muted/50 border-border/50">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {options.filter((opt) => opt.trim() !== "").map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
