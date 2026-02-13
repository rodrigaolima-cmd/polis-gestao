import { ContractRow } from "@/types/contract";

export const mockContracts: ContractRow[] = [
  // Cliente 1 - Prefeitura de Goiânia (multiple products, same global value)
  { id: "1", clientName: "Prefeitura de Goiânia", ugType: "Prefeitura", product: "Polis Saúde", contractedValue: 480000, billedValue: 320000, signatureDate: "2023-03-15", expirationDate: "2025-03-15", billed: true, contractStatus: "Ativo", observations: "" },
  { id: "2", clientName: "Prefeitura de Goiânia", ugType: "Prefeitura", product: "Polis Educação", contractedValue: 480000, billedValue: 80000, signatureDate: "2023-03-15", expirationDate: "2025-03-15", billed: true, contractStatus: "Ativo", observations: "" },
  { id: "3", clientName: "Prefeitura de Goiânia", ugType: "Prefeitura", product: "Polis Gestão", contractedValue: 480000, billedValue: 40000, signatureDate: "2023-03-15", expirationDate: "2025-03-15", billed: false, contractStatus: "Ativo", observations: "Aguardando aprovação" },

  // Cliente 2 - Câmara de Aparecida
  { id: "4", clientName: "Câmara de Aparecida", ugType: "Câmara", product: "Polis Legislativo", contractedValue: 120000, billedValue: 120000, signatureDate: "2024-01-10", expirationDate: "2026-01-10", billed: true, contractStatus: "Ativo", observations: "" },
  { id: "5", clientName: "Câmara de Aparecida", ugType: "Câmara", product: "Polis Transparência", contractedValue: 120000, billedValue: 60000, signatureDate: "2024-01-10", expirationDate: "2026-01-10", billed: true, contractStatus: "Ativo", observations: "" },

  // Cliente 3 - Prefeitura de Anápolis
  { id: "6", clientName: "Prefeitura de Anápolis", ugType: "Prefeitura", product: "Polis Saúde", contractedValue: 350000, billedValue: 350000, signatureDate: "2022-06-01", expirationDate: "2024-06-01", billed: true, contractStatus: "Vencido", observations: "Renovação pendente" },
  { id: "7", clientName: "Prefeitura de Anápolis", ugType: "Prefeitura", product: "Polis Educação", contractedValue: 350000, billedValue: 200000, signatureDate: "2022-06-01", expirationDate: "2024-06-01", billed: true, contractStatus: "Vencido", observations: "" },

  // Cliente 4 - Prefeitura de Trindade
  { id: "8", clientName: "Prefeitura de Trindade", ugType: "Prefeitura", product: "Polis Gestão", contractedValue: 95000, billedValue: 95000, signatureDate: "2024-06-15", expirationDate: "2026-06-15", billed: true, contractStatus: "Ativo", observations: "" },

  // Cliente 5 - Câmara de Goiânia
  { id: "9", clientName: "Câmara de Goiânia", ugType: "Câmara", product: "Polis Legislativo", contractedValue: 250000, billedValue: 125000, signatureDate: "2023-09-01", expirationDate: "2025-09-01", billed: true, contractStatus: "Ativo", observations: "" },
  { id: "10", clientName: "Câmara de Goiânia", ugType: "Câmara", product: "Polis Transparência", contractedValue: 250000, billedValue: 50000, signatureDate: "2023-09-01", expirationDate: "2025-09-01", billed: false, contractStatus: "Ativo", observations: "" },

  // Cliente 6 - Autarquia SANEAGO
  { id: "11", clientName: "SANEAGO", ugType: "Autarquia", product: "Polis Gestão", contractedValue: 520000, billedValue: 400000, signatureDate: "2023-01-20", expirationDate: "2025-01-20", billed: true, contractStatus: "Ativo", observations: "" },
  { id: "12", clientName: "SANEAGO", ugType: "Autarquia", product: "Polis Saúde", contractedValue: 520000, billedValue: 100000, signatureDate: "2023-01-20", expirationDate: "2025-01-20", billed: false, contractStatus: "Ativo", observations: "Implantação parcial" },

  // Cliente 7 - Prefeitura de Senador Canedo
  { id: "13", clientName: "Prefeitura de Senador Canedo", ugType: "Prefeitura", product: "Polis Saúde", contractedValue: 180000, billedValue: 0, signatureDate: "2024-11-01", expirationDate: "2025-04-01", billed: false, contractStatus: "Suspenso", observations: "Contrato suspenso por questões orçamentárias" },

  // Cliente 8 - Câmara de Anápolis
  { id: "14", clientName: "Câmara de Anápolis", ugType: "Câmara", product: "Polis Legislativo", contractedValue: 85000, billedValue: 85000, signatureDate: "2024-03-01", expirationDate: "2026-03-01", billed: true, contractStatus: "Ativo", observations: "" },

  // Cliente 9 - Prefeitura de Inhumas
  { id: "15", clientName: "Prefeitura de Inhumas", ugType: "Prefeitura", product: "Polis Educação", contractedValue: 72000, billedValue: 36000, signatureDate: "2024-08-15", expirationDate: "2025-08-15", billed: true, contractStatus: "Ativo", observations: "" },
  { id: "16", clientName: "Prefeitura de Inhumas", ugType: "Prefeitura", product: "Polis Saúde", contractedValue: 72000, billedValue: 18000, signatureDate: "2024-08-15", expirationDate: "2025-08-15", billed: false, contractStatus: "Ativo", observations: "" },

  // Cliente 10 - Consórcio Público ABC
  { id: "17", clientName: "Consórcio Público ABC", ugType: "Consórcio", product: "Polis Gestão", contractedValue: 200000, billedValue: 200000, signatureDate: "2023-05-01", expirationDate: "2025-05-01", billed: true, contractStatus: "Ativo", observations: "" },

  // Cliente 11 - Prefeitura de Caldas Novas  
  { id: "18", clientName: "Prefeitura de Caldas Novas", ugType: "Prefeitura", product: "Polis Saúde", contractedValue: 310000, billedValue: 155000, signatureDate: "2024-02-01", expirationDate: "2026-02-01", billed: true, contractStatus: "Ativo", observations: "" },
  { id: "19", clientName: "Prefeitura de Caldas Novas", ugType: "Prefeitura", product: "Polis Gestão", contractedValue: 310000, billedValue: 310000, signatureDate: "2024-02-01", expirationDate: "2026-02-01", billed: true, contractStatus: "Ativo", observations: "Faturamento acima do contratado" },

  // Cliente 12 - Prefeitura de Rio Verde
  { id: "20", clientName: "Prefeitura de Rio Verde", ugType: "Prefeitura", product: "Polis Educação", contractedValue: 420000, billedValue: 210000, signatureDate: "2023-07-01", expirationDate: "2025-03-01", billed: true, contractStatus: "Ativo", observations: "" },
  { id: "21", clientName: "Prefeitura de Rio Verde", ugType: "Prefeitura", product: "Polis Saúde", contractedValue: 420000, billedValue: 100000, signatureDate: "2023-07-01", expirationDate: "2025-03-01", billed: false, contractStatus: "Ativo", observations: "" },
  { id: "22", clientName: "Prefeitura de Rio Verde", ugType: "Prefeitura", product: "Polis Transparência", contractedValue: 420000, billedValue: 50000, signatureDate: "2023-07-01", expirationDate: "2025-03-01", billed: false, contractStatus: "Ativo", observations: "" },
];
