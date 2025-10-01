# Uproom - Migração para Prisma + PostgreSQL

Este projeto foi migrado do Supabase para Prisma + PostgreSQL para maior controle e flexibilidade do banco de dados.

## 🚀 Configuração Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados

#### Opção A: Docker (Recomendado)
```bash
npm run db:setup
```

#### Opção B: PostgreSQL Manual
1. Instale PostgreSQL localmente
2. Crie um banco de dados chamado `uproom_dev`
3. Atualize o arquivo `.env` com suas credenciais:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/uproom_dev"
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` e configure:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/uproom_dev"

# JWT Configuration
JWT_SECRET=sua-chave-secreta-jwt-aqui
JWT_EXPIRES_IN=7d

# Domain Configuration
VITE_DOMAIN=localhost:8080

# Environment
NODE_ENV=development
```

### 4. Executar Migrações
```bash
npm run db:migrate
```

### 5. Iniciar o Projeto
```bash
npm run dev
```

## 📊 Comandos do Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# Abrir Prisma Studio (interface visual)
npm run db:studio

# Resetar banco de dados
npm run db:reset
```

## 🗄️ Estrutura do Banco de Dados

### Modelos Principais:
- **User**: Usuários do sistema
- **UserProfile**: Perfis de usuário com informações adicionais
- **Company**: Empresas/workspaces
- **CompanyMember**: Membros das empresas com roles
- **Invitation**: Convites para empresas
- **Message**: Mensagens do sistema
- **UserPresence**: Status de presença dos usuários

### Roles de Usuário:
- `OWNER`: Proprietário da empresa
- `ADMIN`: Administrador
- `MEMBER`: Membro comum
- `TEAM_LEAD`: Líder de equipe

### Status de Usuário:
- `AVAILABLE`: Disponível
- `BUSY`: Ocupado
- `FOCUS`: Em foco
- `MEETING`: Em reunião
- `AWAY`: Ausente
- `OFFLINE`: Offline
- `EMERGENCY`: Emergência

## 🔧 Principais Mudanças

### 1. Autenticação
- Substituído Supabase Auth por JWT + bcrypt
- Sistema de autenticação customizado em `src/lib/auth.ts`

### 2. Banco de Dados
- Migrado de Supabase para Prisma + PostgreSQL
- Schema completo em `prisma/schema.prisma`
- Serviços atualizados em `src/lib/company-prisma.ts`

### 3. Contextos
- `AuthContext` atualizado para usar JWT
- `CompanyContext` adaptado para Prisma

### 4. Hooks
- `useSubdomain` atualizado para usar novos serviços

## 🐳 Docker

O projeto inclui um `docker-compose.yml` para facilitar o desenvolvimento:

```bash
# Iniciar PostgreSQL
docker-compose up -d postgres

# Parar PostgreSQL
docker-compose down
```

## 🔍 Debugging

### Prisma Studio
Interface visual para explorar o banco de dados:
```bash
npm run db:studio
```

### Logs do Banco
```bash
# Ver logs do PostgreSQL
docker-compose logs postgres
```

## 📝 Próximos Passos

1. **Configurar Email**: Implementar envio de emails com Mailgun
2. **WebSockets**: Adicionar real-time para mensagens e presença
3. **Upload de Arquivos**: Sistema de upload de avatares e logos
4. **Testes**: Adicionar testes unitários e de integração

## 🚨 Troubleshooting

### Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Erro de Migração
```bash
# Resetar banco e migrações
npm run db:reset
```

### Erro de JWT
Verifique se `JWT_SECRET` está configurado no `.env`

## 📚 Documentação

- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JWT Docs](https://jwt.io/)
