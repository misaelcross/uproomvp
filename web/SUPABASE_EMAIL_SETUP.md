# Configuração de Confirmação de Email no Supabase

## 1. Configurar no Painel do Supabase

### Passo 1: Acessar as Configurações de Autenticação
1. Acesse o [painel do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **Authentication** > **Settings**

### Passo 2: Configurar Email
1. Na seção **Email**, configure:
   - ✅ **Enable email confirmations**: **ATIVADO**
   - ✅ **Enable email change confirmations**: **ATIVADO**
   - **Email confirmation URL**: `http://localhost:8081/auth/callback`
   - **Email change URL**: `http://localhost:8081/auth/callback`

### Passo 3: Configurar URLs de Redirecionamento
1. Na seção **URL Configuration**:
   - **Site URL**: `http://localhost:8081`
   - **Redirect URLs**: 
     - `http://localhost:8081/auth/callback`
     - `http://localhost:8081/dashboard`
     - `http://localhost:8081/login`

### Passo 4: Configurar Templates de Email (Opcional)
1. Vá para **Authentication** > **Email Templates**
2. Personalize os templates se desejar
3. Ou mantenha os templates padrão

## 2. Configurar Mailgun (Recomendado para Produção)

### Passo 1: Criar Conta no Mailgun
1. Acesse [mailgun.com](https://www.mailgun.com/)
2. Crie uma conta gratuita
3. Verifique seu domínio

### Passo 2: Configurar no Supabase
1. No painel do Supabase, vá para **Settings** > **Auth**
2. Na seção **SMTP Settings**:
   - **Enable custom SMTP**: **ATIVADO**
   - **Host**: `smtp.mailgun.org`
   - **Port**: `587`
   - **Username**: `postmaster@seu-dominio.mailgun.org`
   - **Password**: `sua-senha-mailgun`
   - **Sender email**: `noreply@seu-dominio.com`
   - **Sender name**: `Uproom`

## 3. Atualizar Configurações do Projeto

### Arquivo .env
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://pydjzhwtqstjnunlomii.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Email Configuration (opcional)
MAILGUN_API_KEY=sua-chave-api-mailgun
MAILGUN_DOMAIN=seu-dominio.mailgun.org
```

## 4. Testar o Fluxo

### Registro com Confirmação
1. Usuário se registra
2. Recebe email de confirmação
3. Clica no link do email
4. É redirecionado para `/auth/callback`
5. Conta é confirmada automaticamente

### Páginas Necessárias
- ✅ `/register` - Página de registro
- ✅ `/login` - Página de login  
- ✅ `/auth/callback` - Callback de confirmação
- ✅ `/dashboard` - Página após login

## 5. Configurações de Desenvolvimento

### Para Desenvolvimento Local
- Use `http://localhost:8081` como base URL
- Configure redirects para `localhost:8081`
- Use templates de email padrão do Supabase

### Para Produção
- Configure domínio real
- Use SMTP customizado (Mailgun)
- Configure templates personalizados
