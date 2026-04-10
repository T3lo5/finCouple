# FinCouple 💑

Finanças para dois, com privacidade para cada um.

O **FinCouple** é um aplicativo de gestão financeira projetado especificamente para casais. Ele permite que parceiros gerenciem suas finanças de forma conjunta, mantendo ao mesmo tempo a privacidade individual de cada um.

## ✨ Funcionalidades

### Autenticação e Casais
- ✅ Registro e login de usuários
- ✅ Criação de casais com código de convite
- ✅ Entrada em casais existentes via código
- ✅ Sessões seguras com tokens (30 dias)

### Gestão de Transações
- ✅ Transações individuais e conjuntas
- ✅ Categorização automática (Alimentação, Casa, Transporte, Compras, Saúde, Viagem, Contas, Salário, Investimento, Outros)
- ✅ Receitas e despesas
- ✅ Resumo mensal (receitas, gastos, saldo)
- ✅ Filtros por contexto, categoria e período
- ✅ Paginação de resultados

### Metas de Economia
- ✅ Criação de metas individuais e conjuntas
- ✅ Acompanhamento de progresso
- ✅ Contribuições para metas
- ✅ Status automático (ativo, completado, pausado)
- ✅ Prazos opcionais

### Contas
- ✅ Múltiplos tipos de conta (corrente, poupança, crédito, investimento, benefício)
- ✅ Contas individuais e conjuntas
- ✅ Saldo em tempo real
- ✅ Suporte a múltiplas moedas

### Interface e UX
- 🎨 Design premium dark mode
- 🎨 Tema dourado (joint) e índigo (individual)
- 🎨 Animações suaves com Motion
- 🎨 Toggle de contexto (Individual/Joint)
- 🎨 Modal de transação estilo bottom sheet
- 🎨 Gráficos animados de fluxo financeiro

## 🏗️ Arquitetura

### Backend
- **Runtime:** Bun
- **Framework:** Hono (API REST)
- **Banco de Dados:** PostgreSQL
- **ORM:** Drizzle ORM
- **Autenticação:** Sessions com tokens
- **Validação:** Zod

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4
- **Animações:** Motion (Framer Motion)
- **Ícones:** Lucide React

## 🚀 Quick Start

### Pré-requisitos
- [Bun](https://bun.sh/) instalado
- PostgreSQL rodando localmente ou via Docker
- Variáveis de ambiente configuradas

### Configuração do Banco de Dados

```bash
cd backend

# Configure as variáveis de ambiente
export DATABASE_URL="postgresql://user:password@localhost:5432/fincouple"
export PASSWORD_SALT="seu-salt-seguro"
export FRONTEND_URL="http://localhost:5173"

# Gere as migrations
bun run db:generate

# Execute as migrations
bun run db:migrate

# (Opcional) Abra o studio para visualizar o schema
bun run db:studio
```

### Rodando o Backend

```bash
cd backend
bun run dev
```

A API estará disponível em `http://localhost:3000`

### Rodando o Frontend

```bash
cd frontend
bun run dev
```

O app estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
/workspace
├── backend/
│   ├── src/
│   │   ├── index.ts           # Entry point da API
│   │   ├── db/
│   │   │   ├── client.ts      # Cliente Drizzle
│   │   │   ├── schema.ts      # Schema do banco
│   │   │   └── migrate.ts     # Script de migração
│   │   ├── middleware/
│   │   │   └── auth.ts        # Middleware de autenticação
│   │   └── routes/
│   │       ├── auth.ts        # Rotas de autenticação
│   │       ├── transactions.ts
│   │       ├── savings.ts
│   │       └── accounts.ts
│   ├── drizzle/               # Migrations
│   ├── docker-compose.yml
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.tsx           # Entry point React
    │   ├── App.tsx            # Componente principal
    │   ├── index.css          # Estilos globais + Tailwind
    │   ├── lib/
    │   │   └── api.ts         # Cliente API
    │   ├── hooks/
    │   │   ├── useAuth.tsx    # Hook de autenticação
    │   │   └── useTransactions.ts
    │   └── components/
    │       └── screens/
    │           ├── AuthScreen.tsx
    │           └── OnboardingCouple.tsx
    ├── index.html
    └── package.json
```

## 🔐 Segurança

- Hash de senhas com SHA-256 + salt
- Tokens de sessão HttpOnly
- Validação de entrada com Zod
- Proteção contra CORS configurada
- Controle de acesso baseado em usuário/casal

## 📊 Schema do Banco

O projeto utiliza as seguintes entidades principais:

- **users**: Usuários do sistema
- **couples**: Casais cadastrados
- **accounts**: Contas financeiras
- **transactions**: Transações (receitas/despesas)
- **savings_goals**: Metas de economia
- **recurring_bills**: Contas recorrentes
- **sessions**: Sessões ativas

Cada entidade suporta os contextos `individual` e `joint`, permitindo flexibilidade na gestão financeira.

## 🛣️ Rotas da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Dados do usuário atual |
| POST | `/api/auth/couple/create` | Criar casal |
| POST | `/api/auth/couple/join` | Entrar em casal |

### Transações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/transactions` | Listar transações |
| GET | `/api/transactions/:id` | Obter transação |
| POST | `/api/transactions` | Criar transação |
| PATCH | `/api/transactions/:id` | Atualizar transação |
| DELETE | `/api/transactions/:id` | Deletar transação |
| GET | `/api/transactions/summary/monthly` | Resumo mensal |

### Metas de Economia
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/savings` | Listar metas |
| POST | `/api/savings` | Criar meta |
| POST | `/api/savings/:id/contribute` | Contribuir para meta |
| PATCH | `/api/savings/:id` | Atualizar meta |
| DELETE | `/api/savings/:id` | Deletar meta |

### Contas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/accounts` | Listar contas |
| POST | `/api/accounts` | Criar conta |
| PATCH | `/api/accounts/:id/balance` | Atualizar saldo |
| DELETE | `/api/accounts/:id` | Deletar conta |

## 🎨 Design System

### Cores
| Nome | Valor | Uso |
|------|-------|-----|
| Primary | `#D4AF37` | Dourado - contexto joint |
| Individual | `#6366F1` | Índigo - contexto individual |
| Background | `#08080A` | Fundo principal |
| Surface | `#141417` | Superfícies/cards |
| Text | `#F9FAFB` | Texto principal |
| Muted | `#82828C` | Texto secundário |
| Positive | `#10B981` | Receitas/sucesso |
| Negative | `#F43F5E` | Despesas/erro |

### Tipografia
- **Headings:** Playfair Display (serif)
- **Body:** DM Sans (sans-serif)

### Bordas
- Cards: `24px` border-radius
- Inputs/Botões: `20px` border-radius

## 🤝 Como Funciona o Contexto

O conceito central do FinCouple é o **contexto**:

- **Individual**: Transações, contas e metas visíveis apenas para o usuário
- **Joint**: Compartilhado entre ambos os membros do casal

O toggle no topo da aplicação permite alternar entre as visualizações, garantindo transparência onde desejado e privacidade quando necessário.

## 📝 License

MIT

---

Desenvolvido com ❤️ para casais modernos
