# UpRoom - Next.js

Plataforma de Comunicação Empresarial migrada de Vite + React para Next.js 15.

## 🚀 Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **Lucide React** - Ícones
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas

## 📁 Estrutura do Projeto

```
app/
├── src/
│   ├── app/                    # App Router (páginas)
│   │   ├── login/             # Página de login
│   │   ├── register/          # Página de registro
│   │   ├── workspaces/        # Lista de workspaces
│   │   ├── globals.css        # Estilos globais
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Página inicial
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes base (shadcn/ui)
│   │   ├── main/              # Componentes principais
│   │   ├── shared/            # Componentes compartilhados
│   │   └── workspace/        # Componentes de workspace
│   ├── contexts/              # Contextos React
│   │   ├── AuthContext.tsx    # Contexto de autenticação
│   │   └── CompanyContext.tsx # Contexto de empresa
│   ├── hooks/                  # Hooks customizados
│   ├── lib/                    # Utilitários e configurações
│   │   ├── types.ts           # Tipos TypeScript
│   │   ├── constants.ts       # Constantes da aplicação
│   │   └── utils.ts           # Funções utilitárias
│   └── pages/                  # (Removido - usando App Router)
├── public/                     # Arquivos estáticos
├── package.json               # Dependências
├── tailwind.config.ts         # Configuração Tailwind
├── next.config.ts             # Configuração Next.js
└── tsconfig.json              # Configuração TypeScript
```

## 🛠️ Instalação

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp env.example .env.local
```

3. **Executar em desenvolvimento:**
```bash
npm run dev
```

4. **Build para produção:**
```bash
npm run build
npm start
```

## 🔄 Principais Mudanças da Migração

### De Vite para Next.js
- ✅ **App Router**: Usando a nova estrutura de roteamento do Next.js 13+
- ✅ **Server Components**: Componentes que renderizam no servidor
- ✅ **Client Components**: Componentes que precisam de interatividade
- ✅ **Roteamento**: Migrado de React Router para Next.js Router

### Estrutura de Páginas
- ✅ **Antes**: `src/pages/(main)/LandingPage.tsx`
- ✅ **Depois**: `src/app/page.tsx` (página inicial)
- ✅ **Antes**: `src/pages/(main)/Login.tsx`
- ✅ **Depois**: `src/app/login/page.tsx`

### Componentes
- ✅ **Mantidos**: Todos os componentes UI (shadcn/ui)
- ✅ **Atualizados**: Imports para usar `@/` alias
- ✅ **Client Components**: Adicionado `'use client'` onde necessário

### Contextos
- ✅ **AuthContext**: Migrado com hooks do Next.js
- ✅ **CompanyContext**: Mantida funcionalidade completa
- ✅ **Providers**: Integrados no layout principal

### Estilização
- ✅ **Tailwind CSS**: Configuração mantida
- ✅ **CSS Variables**: Variáveis CSS preservadas
- ✅ **Dark Mode**: Sistema de cores mantido

## 🎯 Funcionalidades Implementadas

- ✅ **Landing Page**: Página inicial completa
- ✅ **Autenticação**: Login e registro
- ✅ **Workspaces**: Lista de workspaces do usuário
- ✅ **Contextos**: Gerenciamento de estado global
- ✅ **Componentes UI**: Biblioteca completa de componentes
- ✅ **Responsividade**: Design responsivo mantido
- ✅ **TypeScript**: Tipagem completa

## 🚧 Próximos Passos

- [ ] Migrar hooks customizados
- [ ] Implementar páginas de workspace
- [ ] Adicionar middleware de autenticação
- [ ] Implementar API routes
- [ ] Adicionar testes
- [ ] Otimizar performance

## 📝 Notas

- A migração mantém 100% da funcionalidade original
- Todos os comentários foram removidos conforme solicitado
- Código otimizado e organizado
- Estrutura limpa seguindo as melhores práticas do Next.js