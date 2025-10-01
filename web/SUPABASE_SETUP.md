# Configuração do Supabase Auth

## Passos para configurar a autenticação com Supabase:

### 1. Obter as credenciais do Supabase

1. Acesse o [painel do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **Settings** > **API**
4. Copie as seguintes informações:
   - **Project URL** (ex: `https://pydjzhwtqstjnunlomii.supabase.co`)
   - **anon public** key (chave pública anônima)

### 2. Atualizar o arquivo .env

Substitua as seguintes linhas no arquivo `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://pydjzhwtqstjnunlomii.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 3. Configurar autenticação no Supabase

1. No painel do Supabase, vá para **Authentication** > **Settings**
2. Configure as seguintes opções:
   - **Site URL**: `http://localhost:8080`
   - **Redirect URLs**: `http://localhost:8080/auth/callback`
3. Em **Email**, configure:
   - **Enable email confirmations**: Desabilitado (para desenvolvimento)
   - **Enable email change confirmations**: Desabilitado (para desenvolvimento)

### 4. Testar a autenticação

Após configurar as credenciais, você pode testar:

1. Iniciar o servidor: `npm run dev:full`
2. Acessar: `http://localhost:8080`
3. Tentar fazer login/registro

### 5. Sincronização com Prisma

O Supabase Auth gerencia a autenticação, mas você pode sincronizar os dados do usuário com o Prisma quando necessário. O usuário autenticado estará disponível através do `AuthContext`.

## Estrutura atual:

- ✅ **Supabase Auth**: Gerencia login, registro, reset de senha
- ✅ **Prisma**: Gerencia dados da aplicação (empresas, mensagens, etc.)
- ✅ **Servidor Express**: Apenas para APIs de dados (sem autenticação)
- ✅ **Frontend**: Usa Supabase Auth para autenticação
