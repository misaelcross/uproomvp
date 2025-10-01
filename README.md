# 🚀 UpRoom - Plataforma de Comunicação Empresarial

UpRoom é uma plataforma moderna de comunicação empresarial que permite criar workspaces personalizados para equipes, com sistema de subdomínios, chat em tempo real e gerenciamento de membros.

## 📋 Índice

- [Características](#-características)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Documentação da API](#-documentação-da-api)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Troubleshooting](#-troubleshooting)
- [Contribuição](#-contribuição)

## ✨ Características

- 🏢 **Workspaces Personalizados**: Cada empresa tem seu próprio subdomínio
- 💬 **Chat em Tempo Real**: Sistema de mensagens instantâneas
- 👥 **Gerenciamento de Equipes**: Convites e controle de acesso
- 🔐 **Autenticação Segura**: Integração com Supabase Auth
- 📱 **Interface Responsiva**: Design moderno e mobile-friendly
- 🚀 **API RESTful**: Documentação completa com Swagger
- 🌐 **Multi-tenant**: Suporte a múltiplas empresas

## 🛠 Tecnologias

### Frontend
- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Vite** - Build tool moderna
- **Tailwind CSS** - Framework de estilos
- **React Query** - Gerenciamento de estado do servidor
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas

### Backend
- **Node.js** - Runtime JavaScript
- **Fastify** - Framework web rápido
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **Supabase** - Autenticação e serviços
- **Swagger** - Documentação da API

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **PostgreSQL** (versão 13 ou superior)
- **Git**

### Verificando as Instalações

```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar PostgreSQL
psql --version

# Verificar Git
git --version
```

## 🚀 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/uproom.git
cd uproom
```

### 2. Instalar Dependências

```bash
# Instalar dependências do backend
cd api
npm install

# Instalar dependências do frontend
cd ../web
npm install
```

### 3. Configurar Banco de Dados

#### Criar Banco PostgreSQL

```sql
-- Conectar ao PostgreSQL como superuser
psql -U postgres

-- Criar banco de dados
CREATE DATABASE uproom;

-- Criar usuário (opcional)
CREATE USER uproom_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE uproom TO uproom_user;
```

#### Configurar Variáveis de Ambiente

```bash
# Backend - Copiar arquivo de exemplo
cd api
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/uproom"

# Supabase
SUPABASE_URL="sua-url-do-supabase"
SUPABASE_ANON_KEY="sua-chave-anonima"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-de-servico"

# Server
PORT=3333
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173,http://localhost:8080,https://uproom.com"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW="1 minute"
```

```bash
# Frontend - Copiar arquivo de exemplo
cd ../web
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Supabase
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# API
VITE_API_URL=http://localhost:3333
```

### 4. Configurar Banco de Dados

```bash
# Gerar cliente Prisma
cd api
npm run db:generate

# Executar migrações
npm run db:migrate

# (Opcional) Abrir Prisma Studio
npm run db:studio
```

## ⚙️ Configuração

### Supabase Setup

1. **Criar Projeto no Supabase**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e as chaves

2. **Configurar Autenticação**
   - No painel do Supabase, vá para Authentication > Settings
   - Configure as URLs permitidas:
     - `http://localhost:8080`
     - `http://localhost:5173`
     - `https://uproom.com`


## 🏃‍♂️ Executando o Projeto

### Desenvolvimento

#### Terminal 1 - Backend
```bash
cd api
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd web
npm run dev
```

### URLs de Acesso

- **Frontend Principal**: http://localhost:8080
- **API Backend**: http://localhost:3333
- **Documentação API**: http://localhost:3333/docs
- **Health Check**: http://localhost:3333/health

### Produção

#### Build do Frontend
```bash
cd web
npm run build
```

#### Executar Backend em Produção
```bash
cd api
npm run build
npm start
```

## 📚 Documentação da API

A API possui documentação completa gerada automaticamente com Swagger:

### Acessar Documentação
- **Interface Visual**: http://localhost:3333/docs
- **JSON Schema**: http://localhost:3333/swagger.json

### Endpoints Principais

#### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/logout` - Logout

#### Empresas
- `POST /api/companies` - Criar empresa
- `GET /api/companies/user/:userId` - Listar empresas do usuário
- `GET /api/companies/subdomain/:subdomain` - Buscar empresa por subdomínio
- `GET /api/companies/check-subdomain/:subdomain` - Verificar disponibilidade

#### Conversas
- `GET /api/conversations` - Listar conversas
- `POST /api/conversations` - Criar conversa
- `GET /api/conversations/:id/messages` - Buscar mensagens

### Autenticação

Todos os endpoints protegidos requerem o header:
```
Authorization: Bearer <token>
```

## 📁 Estrutura do Projeto

```
uproom/
├── api/                    # Backend (Node.js + Fastify)
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── lib/           # Utilitários e configurações
│   │   └── index.ts       # Ponto de entrada
│   ├── prisma/            # Schema do banco
│   ├── package.json
│   └── .env
├── web/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilitários
│   │   └── contexts/      # Contextos React
│   ├── public/            # Arquivos estáticos
│   ├── package.json
│   └── .env
└── README.md
```

## 📜 Scripts Disponíveis

### Backend (api/)

```bash
npm run dev          # Executar em modo desenvolvimento
npm run build        # Compilar TypeScript
npm start           # Executar versão compilada
npm run db:generate # Gerar cliente Prisma
npm run db:push     # Sincronizar schema com banco
npm run db:migrate   # Executar migrações
npm run db:studio    # Abrir Prisma Studio
```

### Frontend (web/)

```bash
npm run dev         # Executar em modo desenvolvimento
npm run build       # Build para produção
npm run preview     # Preview do build
npm run lint        # Executar linter
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
pg_ctl status

# Reiniciar PostgreSQL
pg_ctl restart
```

#### 2. Erro de CORS
- Verificar se as URLs estão corretas no `.env`
- Verificar se o backend está rodando na porta 3333

#### 3. Erro de Autenticação
- Verificar se as chaves do Supabase estão corretas
- Verificar se as URLs estão configuradas no Supabase

#### 4. Problemas com Subdomínios
- Verificar configuração do arquivo hosts
- Usar navegador em modo incógnito para testar

### Logs de Debug

```bash
# Backend - logs detalhados
cd api
DEBUG=* npm run dev

# Frontend - logs do Vite
cd web
npm run dev -- --debug
```

### Limpeza e Reset

```bash
# Limpar node_modules
rm -rf api/node_modules web/node_modules
npm install

# Reset do banco de dados
cd api
npx prisma migrate reset
```

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### Padrões de Código

- Use **TypeScript** para tipagem
- Siga as convenções do **ESLint**
- Escreva **testes** para novas funcionalidades
- Documente APIs com **Swagger**
- Use **commits semânticos**

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: support@uproom.com
- **GitHub Issues**: [Reportar problemas](https://github.com/seu-usuario/uproom/issues)
- **Documentação**: [docs.uproom.com](https://docs.uproom.com)

---

**Desenvolvido com ❤️ pela equipe UpRoom**
