

## Correção de dados e prevenção de duplicação na importação

### Diagnóstico

| Caso | Causa raiz | Dados encontrados |
|------|-----------|-------------------|
| **Frei Gaspar** | "Prefeitura Municipal de Frei Gaspar" **não existe** no banco. Só existe "Câmara Municipal de Frei Gaspar" (cód. 65). O registro nunca foi importado — provavelmente ausente na planilha ou com nome diferente. | Precisa ser criado manualmente. |
| **Gonzaga** | Cód. 22 = "Prefeitura Municipal de Gonzaga" / Cód. 47 = "Prefeitura **Munixipal** de Gonzaga" (typo). Import criou registro novo porque o nome é diferente. | Cód. 47 tem 1 módulo vinculado. |
| **Santa Rita do Itueto** | Cód. 42 = "...Itueto" / Cód. 101 = "...Ituêto" (acento circunflexo). Import não normaliza acentos na comparação. | Cód. 42 tem 6 módulos; Cód. 101 tem 1 módulo. |

### Implementação

#### 1. Migration SQL — merge + criação

**A) Criar "Prefeitura Municipal de Frei Gaspar"**
- INSERT com status "Ativo", mesmos campos padrão dos demais clientes

**B) Merge Gonzaga: mover módulos do cód. 47 → cód. 22, deletar cód. 47**
- `UPDATE client_modules SET client_id = '{id-22}' WHERE client_id = '{id-47}'`
- `DELETE FROM clients WHERE id = '{id-47}'`

**C) Merge Santa Rita do Itueto: mover módulo do cód. 101 → cód. 42, deletar cód. 101**
- `UPDATE client_modules SET client_id = '{id-42}' WHERE client_id = '{id-101}'`
- `DELETE FROM clients WHERE id = '{id-101}'`

IDs concretos:
- Gonzaga canonical: `1f0a2640-e060-4434-9921-637d759964e2` (cód. 22)
- Gonzaga duplicate: `c7023281-e047-445b-8c00-3971ddb2e202` (cód. 47)
- Santa Rita canonical: `5d0fb6fe-8967-4ecc-8ed8-10f540aaa6ae` (cód. 42)
- Santa Rita duplicate: `db8911e1-543e-483e-9e32-3e01eabfb6d2` (cód. 101)

#### 2. `src/hooks/useContracts.ts` — normalização accent-insensitive no import

Trocar a chave de lookup de clientes de:
```ts
key = r.clientName.trim().toLowerCase()
```
Para usar `normalizeForSearch` (que já faz NFD + strip accents + lowercase + trim):
```ts
import { normalizeForSearch } from "@/utils/textUtils";
// ...
const key = normalizeForSearch(r.clientName);
```

Aplicar a mesma normalização ao construir o `clientMap` a partir dos clientes existentes:
```ts
clientMap.set(normalizeForSearch(c.nome_cliente), c.id);
```

Isso evita que "Itueto" vs "Ituêto" ou "Municipal" vs "Munixipal" (se corrigido na fonte) criem duplicatas.

#### 3. Audit log da merge

Inserir registros na tabela `audit_logs` documentando cada merge:
- action: `"client_merge"`
- entity_type: `"client"`
- entity_id: ID canônico
- details: `{ duplicate_id, duplicate_name, canonical_name, modules_moved }`

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Merge duplicatas + criar Frei Gaspar |
| `src/hooks/useContracts.ts` | Normalização accent-insensitive na chave de lookup |

### O que NÃO muda
- Layout, dashboard, cálculos, relatórios
- Formulários de cliente, RLS, edge functions
- Tabela de módulos, sidebar, tema

