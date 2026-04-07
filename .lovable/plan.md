

## Corrigir máscaras de telefone no formulário de cliente

### Problema
A função `maskPhone` atual usa o mesmo formato para ambos os campos. O usuário quer formatos distintos:
- **Fone** (fixo, 10 dígitos): `XX-XXXX XXXX`
- **Celular** (móvel, 11 dígitos): `XX-XXXXX XXXX`

### Solução

**Arquivo**: `src/components/clientes/ClienteForm.tsx`

1. Separar `maskPhone` em duas funções:
   - `maskFone(v)`: limita a 10 dígitos, formato `XX-XXXX XXXX`
   - `maskCelular(v)`: limita a 11 dígitos, formato `XX-XXXXX XXXX`

2. No campo Fone: usar `maskFone` e `maxLength={12}`
3. No campo Celular: usar `maskCelular` e `maxLength={13}`

### O que NÃO muda
- Lógica de salvamento, validações, layout, seções do formulário

