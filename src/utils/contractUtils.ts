import { ContractRow, ClientSummary, DashboardFilters } from "@/types/contract";
import { differenceInDays, parseISO, format } from "date-fns";

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
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!c.clientName.toLowerCase().includes(q) && !c.product.toLowerCase().includes(q)) return false;
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
    .sort((a, b) => b.billed - a.billed);
}

// Contracts by status
export function getContractsByStatus(contracts: ContractRow[]): { status: string; count: number }[] {
  const map = new Map<string, number>();
  contracts.forEach((c) => {
    map.set(c.contractStatus, (map.get(c.contractStatus) || 0) + 1);
  });
  return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
}

// Distribution by UG type
export function getDistributionByUG(contracts: ContractRow[]): { ugType: string; count: number }[] {
  const map = new Map<string, number>();
  contracts.forEach((c) => {
    map.set(c.ugType, (map.get(c.ugType) || 0) + 1);
  });
  return Array.from(map.entries()).map(([ugType, count]) => ({ ugType, count }));
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
};
