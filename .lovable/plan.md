
# Ativar usuário como Admin

O usuário `Rodrigo Lima` (id: `50098ee2-62b4-49ca-a110-a5de8e955754`) existe na tabela `profiles` com `is_active = false` e sem role definida.

## Ações necessárias (dados, não schema):

1. **UPDATE** `profiles` → `is_active = true` para o user_id
2. **INSERT** em `user_roles` → `role = 'admin'` para o user_id

Após isso, o usuário poderá fazer login, acessar o dashboard e a página de configurações para gerenciar outros usuários.
