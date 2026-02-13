export interface ContractRow {
  id: string;
  clientName: string;
  ugType: string;
  product: string;
  contractedValue: number;
  billedValue: number;
  signatureDate: string;
  expirationDate: string;
  billed: boolean;
  contractStatus: string;
  observations: string;
}

export interface ClientSummary {
  clientName: string;
  ugType: string;
  totalContracted: number;
  totalBilled: number;
  difference: number;
  billedPercentage: number;
  productCount: number;
  products: string[];
  nextExpiration: string;
  daysToExpire: number;
  status: string;
  hasOverbilling: boolean;
}

export interface DashboardFilters {
  ugType: string;
  product: string;
  contractStatus: string;
  signatureYear: string;
  expirationYear: string;
  client: string;
  onlyWithDifference: boolean;
  expireInDays: number | null;
  search: string;
}
