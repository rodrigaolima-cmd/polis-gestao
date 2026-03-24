import { ContractRow, ClientSummary, DashboardFilters } from "@/types/contract";
import { differenceInDays, parseISO, format } from "date-fns";
import { normalizeForSearch } from "@/utils/textUtils";

const today = new Date();

export function getDaysToExpire(expirationDate: string): number {
  if (!expirationDate) return 0;
  try {
    const parsed = parseISO(expirationDate);
    if (isNaN(parsed.getTime())) return 0;
    return differenceInDays(parsed, today);
  } catch {
    return 0;
  }
}

export function getExpirationStatus(days: number): "expired" | "critical" | "warning" | "ok" {
  if (days < 0) return "expired";
  if (days <= 30) return "critical";
  if (days <= 90) return "warning";
  return "ok";
}

export function consolidateByClient(contracts: ContractRow[]): ClientSummary[] {
  const grouped = new Map<string, ContractRow[]>();
  contracts.forEach((c) => {
    const existing = grouped.get(c.clientName) || [];
    existing.push(c);
    grouped.set(c.clientName, existing);
  });

  const result = Array.from(grouped.entries()).map(([clientName, rows]) => {
    // Use MAX contracted value (global contract repeated per product)
    const totalContracted = rows.reduce((sum, r) => sum + r.contractedValue, 0);
    const totalBilled = rows.reduce((sum, r) => sum + r.billedValue, 0);
    const difference = totalContracted - totalBilled;
    const billedPercentage = totalContracted > 0 ? (totalBilled / totalContracted) * 100 : 0;
    const products = [...new Set(rows.map((r) => r.product))];
    const dates = rows.map((r) => r.expirationDate).sort();
    const nextExpiration = dates[0];
    const daysToExpire = getDaysToExpire(nextExpiration);

    // Extract regiao/consultor: first non-empty, detect conflicts
    const regiaoValues = [...new Set(rows.map(r => r.regiao?.trim()).filter(Boolean))];
    const consultorValues = [...new Set(rows.map(r => r.consultor?.trim()).filter(Boolean))];

    return {
      clientName,
      ugType: rows[0].ugType,
      totalContracted,
      totalBilled,
      difference,
      billedPercentage,
      productCount: products.length,
      products,
      nextExpiration,
      daysToExpire,
      status: rows[0].contractStatus,
      hasOverbilling: totalBilled > totalContracted,
      regiao: regiaoValues[0] || "",
      consultor: consultorValues[0] || "",
      regiaoConflict: regiaoValues.length > 1,
      consultorConflict: consultorValues.length > 1,
    };
  });
  return result.sort((a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR'));
}

export function applyFilters(contracts: ContractRow[], filters: DashboardFilters): ContractRow[] {
  return contracts.filter((c) => {
    if (filters.ugType && c.ugType !== filters.ugType) return false;
    if (filters.product && c.product !== filters.product) return false;
    if (filters.contractStatus && c.contractStatus !== filters.contractStatus) return false;
    if (filters.signatureYear && !c.signatureDate.startsWith(filters.signatureYear)) return false;
    if (filters.expirationYear && !c.expirationDate.startsWith(filters.expirationYear)) return false;
    if (filters.client && c.clientName !== filters.client) return false;
    if (filters.regiao && (c.regiao || "").trim() !== filters.regiao) return false;
    if (filters.consultor && (c.consultor || "").trim() !== filters.consultor) return false;
    if (filters.search) {
      const q = normalizeForSearch(filters.search);
      if (!normalizeForSearch(c.clientName).includes(q) && !normalizeForSearch(c.product).includes(q)) return false;
    }
    if (filters.onlyWithDifference) {
      // We check difference at row level (not consolidated), basic filter
      if (c.contractedValue - c.billedValue <= 0) return false;
    }
    if (filters.expireInDays !== null) {
      const days = getDaysToExpire(c.expirationDate);
      if (days > filters.expireInDays) return false;
    }
    return true;
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const parsed = parseISO(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    return format(parsed, "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

export function getUniqueValues(contracts: ContractRow[], key: keyof ContractRow): string[] {
  return [...new Set(contracts.map((c) => String(c[key])))].sort();
}

export function getUniqueYears(contracts: ContractRow[], dateKey: "signatureDate" | "expirationDate"): string[] {
  return [...new Set(contracts.map((c) => c[dateKey].substring(0, 4)))].sort();
}

// Billing by product
export function getBillingByProduct(contracts: ContractRow[]): { product: string; billed: number }[] {
  const map = new Map<string, number>();
  contracts.forEach((c) => {
    map.set(c.product, (map.get(c.product) || 0) + c.billedValue);
  });
  return Array.from(map.entries())
    .map(([product, billed]) => ({ product, billed }))
    .sort((a, b) => a.product.localeCompare(b.product, 'pt-BR'));
}

// Contracts by status
export function getContractsByStatus(contracts: ContractRow[]): { status: string; count: number }[] {
  const map = new Map<string, number>();
  contracts.forEach((c) => {
    map.set(c.contractStatus, (map.get(c.contractStatus) || 0) + 1);
  });
  return Array.from(map.entries()).map(([status, count]) => ({ status, count })).sort((a, b) => a.status.localeCompare(b.status, 'pt-BR'));
}

// Distribution by UG type
export function getDistributionByUG(contracts: ContractRow[]): { ugType: string; count: number }[] {
  const map = new Map<string, number>();
  contracts.forEach((c) => {
    map.set(c.ugType, (map.get(c.ugType) || 0) + 1);
  });
  return Array.from(map.entries()).map(([ugType, count]) => ({ ugType, count })).sort((a, b) => a.ugType.localeCompare(b.ugType, 'pt-BR'));
}

// Expiration timeline by month
export function getExpirationTimeline(contracts: ContractRow[]): { month: string; count: number }[] {
  const map = new Map<string, number>();
  contracts.forEach((c) => {
    const month = c.expirationDate.substring(0, 7); // YYYY-MM
    map.set(month, (map.get(month) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Helper: check if contract status means "active"
export function isActiveStatus(status: string): boolean {
  const s = status.trim().toLowerCase();
  const negativos = ["inativ", "cancel", "suspens", "encerr", "vencid", "rescind"];
  if (negativos.some(n => s.includes(n))) return false;
  return s.includes("ativ") || s.includes("vigente") || s.includes("em vigor") || s === "active";
}

// Generate monthly trend data for sparklines
export function getMonthlyTrend(
  contracts: ContractRow[],
  mode: "contractedValue" | "billedValue" | "unbilled" | "count" | "activeCount" | "expiredCount",
  months = 6
): number[] {
  const now = new Date();
  const result: number[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = format(targetMonth, "yyyy-MM");

    // Filter contracts whose signature month <= target and expiration month >= target
    const relevant = contracts.filter((c) => {
      const sigMonth = c.signatureDate.substring(0, 7);
      const expMonth = c.expirationDate.substring(0, 7);
      return sigMonth <= ym && expMonth >= ym;
    });

    switch (mode) {
      case "contractedValue":
        result.push(relevant.reduce((s, c) => s + c.contractedValue, 0));
        break;
      case "billedValue":
        result.push(relevant.reduce((s, c) => s + c.billedValue, 0));
        break;
      case "unbilled":
        result.push(relevant.reduce((s, c) => s + (c.contractedValue - c.billedValue), 0));
        break;
      case "count":
        result.push(relevant.length);
        break;
      case "activeCount":
        result.push(relevant.filter((c) => isActiveStatus(c.contractStatus)).length);
        break;
      case "expiredCount": {
        const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
        result.push(contracts.filter((c) => {
          try {
            const exp = parseISO(c.expirationDate);
            return exp < monthEnd && exp >= new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
          } catch { return false; }
        }).length);
        break;
      }
    }
  }
  return result;
}

export const defaultFilters: DashboardFilters = {
  ugType: "",
  product: "",
  contractStatus: "",
  signatureYear: "",
  expirationYear: "",
  client: "",
  onlyWithDifference: false,
  expireInDays: null,
  search: "",
  regiao: "",
  consultor: "",
};
