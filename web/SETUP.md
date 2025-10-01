# 🚀 Configuração do Uproom

## Problema Resolvido

Os erros 404 nas rotas de autenticação foram causados pela falta de um servidor backend. O projeto estava configurado apenas como frontend, mas tentava fazer chamadas para rotas de API que não existiam.

## ✅ Solução Implementada

1. **Servidor Backend Express**: Criado `server.js` com todas as rotas de autenticação
2. **Proxy Vite**: Configurado para redirecionar `/api/*` para o servidor backend
3. **Scripts de Desenvolvimento**: Adicionados scripts para executar frontend e backend simultaneamente

## 🛠️ Como Executar

### Opção 1: Desenvolvimento Completo (Recomendado)
```bash
npm run dev:full
```
Este comando inicia tanto o servidor backend (porta 3001) quanto o frontend (porta 8080).

### Opção 2: Executar Separadamente

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 📡 Rotas de API Disponíveis

- `POST /api/auth/signup` - Registro de usuário
- `POST /api/auth/signin` - Login de usuário
- `GET /api/auth/me` - Obter dados do usuário autenticado
- `POST /api/auth/reset-password` - Reset de senha
- `POST /api/auth/update-password` - Atualizar senha
- `GET /api/health` - Health check

## 🔧 Configuração do Banco de Dados

1. **Configurar PostgreSQL:**
```bash
npm run db:setup
```

2. **Executar migrações:**
```bash
npm run db:migrate
```

3. **Configurar variáveis de ambiente:**
Copie `env.example` para `.env` e configure:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/uproom_dev"
JWT_SECRET=sua-chave-secreta-jwt-aqui
JWT_EXPIRES_IN=7d
```

## 🐛 Problemas Resolvidos

- ✅ Erro 404 nas rotas `/api/auth/signup` e `/api/auth/signin`
- ✅ Erro "Unexpected end of JSON input" 
- ✅ Configuração de CORS entre frontend e backend
- ✅ Proxy para redirecionar chamadas de API

## 📝 Próximos Passos

1. Testar funcionalidade de login e registro
2. Configurar banco de dados se necessário
3. Implementar funcionalidades adicionais de autenticação
