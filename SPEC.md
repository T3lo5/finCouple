# Especificação do Projeto - FinCouple

Este documento define os requisitos visuais e de código que devem ser seguidos para considerar o projeto finalizado.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Requisitos Visuais](#requisitos-visuais)
3. [Requisitos de Código](#requisitos-de-código)
4. [Critérios de Aceitação](#critérios-de-aceitação)
5. [Definição de Pronto](#definição-de-pronto)

---

## Visão Geral

O FinCouple é um aplicativo de gestão financeira para casais com foco em:
- **Privacidade individual** com opção de compartilhamento conjunto
- **Design premium** dark mode com animações fluidas
- **UX intuitiva** mobile-first
- **Segurança** de dados financeiros

---

## Requisitos Visuais

### Paleta de Cores

| Variável | Valor | Uso |
|----------|-------|-----|
| `--color-primary` | `#D4AF37` | Acentos principais, contexto joint |
| `--color-individual` | `#6366F1` | Contexto individual |
| `--color-background` | `#08080A` | Fundo da aplicação |
| `--color-surface` | `#141417` | Cards, modais, superfícies |
| `--color-text` | `#F9FAFB` | Texto principal |
| `--color-muted` | `#82828C` | Texto secundário |
| `--color-positive` | `#10B981` | Receitas, sucesso |
| `--color-negative` | `#F43F5E` | Despesas, erro |

### Tipografia

```css
--font-headings: "Playfair Display", serif;
--font-body: "DM Sans", sans-serif;
```

- Títulos: Playfair Display (400-700)
- Corpo: DM Sans (100-1000)
- Hierarquia clara com tamanhos progressivos

### Componentes UI

#### Toggle de Contexto
- Posição: Topo central fixo
- Estilo: Pílula com backdrop blur
- Estados: Individual (índigo) / Joint (dourado)
- Animação: Spring transition no toggle

#### Botões
- Border-radius: `20px` (padrão), `24px` (grande)
- Estados: default, hover, active (scale 0.97), disabled
- Loading: Spinner interno

#### Cards
- Border-radius: `24px`
- Background: `rgba(255, 255, 255, 0.03)`
- Border: `1px solid rgba(255, 255, 255, 0.05)`
- Padding: `16px-24px`

#### Inputs
- Border-radius: `20px`
- Height mínimo: `48px`
- Focus border: `primary/40`
- Placeholder: `muted/40`

#### Modal Bottom Sheet
- Abertura: Slide up com spring
- Backdrop: Blur + escurecimento
- Handle superior: `w-12 h-1.5 bg-white/10 rounded-full`
- Altura máxima: `80vh`

### Animações

| Elemento | Tipo | Duração | Easing |
|----------|------|---------|--------|
| Toggle | Spring | 0.6s | bounce 0.2 |
| Modal | Slide up | 0.5s | spring damping 25 |
| Fade in/out | Opacity | 0.3-0.8s | ease-out |
| Botão active | Scale | 0.1s | linear |
| Gráficos | Path draw | 1.5s | easeInOut |

### Ícones

- Biblioteca: Lucide React
- Tamanhos: 16px, 18px, 20px, 24px, 28px
- Cor: Contextual (primary, muted, text)

### Layout

- Mobile-first
- Container máximo: `max-w-sm` (telas pequenas)
- Padding lateral: `16px-24px`
- Espaçamento vertical: `8px-32px` (escala Tailwind)

---

## Requisitos de Código

### Backend

#### Estrutura de Pastas
```
backend/src/
├── index.ts              # Entry point, setup Hono
├── db/
│   ├── client.ts         # Conexão PostgreSQL + Drizzle
│   ├── schema.ts         # Definição das tabelas
│   └── migrate.ts        # Script de migração
├── middleware/
│   └── auth.ts           # requireAuth middleware
└── routes/
    ├── auth.ts           # Autenticação e casais
    ├── transactions.ts   # CRUD transações
    ├── savings.ts        # CRUD metas
    └── accounts.ts       # CRUD contas
```

#### Padrões de Código

**Rotas (Hono)**
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'

const router = new Hono()
router.use(requireAuth)

const schema = z.object({ /* ... */ })

router.get('/', async (c) => { /* ... */ })
router.post('/', zValidator('json', schema), async (c) => { /* ... */ })

export default router
```

**Schema Drizzle**
```typescript
import { pgTable, text, numeric, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'

export const entities = pgTable('entities', {
  id:        text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:    text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  coupleId:  text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
  context:   contextEnum('context').notNull().default('individual'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Middleware de Auth**
```typescript
export const requireAuth = createMiddleware(async (c, next) => {
  // Extrair token do header Authorization ou cookie
  // Validar sessão no banco
  // Injetar user no context
  await next()
})
```

#### Validações

Todos os inputs devem ser validados com Zod:
- Emails: `z.string().email()`
- Senhas: `z.string().min(8)`
- Números monetários: `z.number().positive()`
- Enums: `z.enum(['individual', 'joint'])`
- Strings: `z.string().min(1).max(120)`

#### Respostas API

Padrão de resposta:
```json
// Sucesso
{ "data": { /* ... */ } }
{ "data": [], "meta": { "total": 0, "page": 1 } }

// Erro
{ "error": "mensagem" }
```

Status codes:
- `200`: OK
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

### Frontend

#### Estrutura de Pastas
```
frontend/src/
├── main.tsx              # Entry point React
├── App.tsx               # Componente raiz
├── index.css             # Estilos globais + Tailwind
├── lib/
│   └── api.ts            # Cliente API tipado
├── hooks/
│   ├── useAuth.tsx       # Estado de autenticação
│   └── useTransactions.ts
└── components/
    └── screens/
        ├── AuthScreen.tsx
        └── OnboardingCouple.tsx
```

#### Padrões de Código

**Hooks Customizados**
```typescript
interface UseXOptions {
  context?: Context
  autoFetch?: boolean
}

export function useX({ context, autoFetch = true }: UseXOptions = {}) {
  const [state, setState] = useState<T>(null)
  const [loading, setLoading] = useState(false)
  
  const fetch = useCallback(async () => { /* ... */ }, [context])
  
  useEffect(() => {
    if (autoFetch) fetch()
  }, [fetch, autoFetch])
  
  return { data: state, loading, refetch: fetch }
}
```

**Componentes**
```typescript
interface Props {
  context: Context
  onAction?: () => void
}

export default function Component({ context, onAction }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ... */}
    </motion.div>
  )
}
```

**Cliente API**
```typescript
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('session_token')
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  })
  // Handle errors...
}
```

#### TypeScript

- Tipagem estrita habilitada
- Interfaces para todas as entidades
- Types derivados do backend
- Generics em requisições API

#### Gerenciamento de Estado

- Context API para auth (`AuthProvider`)
- Hooks locais para features específicas
- Sem bibliotecas externas de estado global

---

## Critérios de Aceitação

### Funcionais

#### Autenticação
- [ ] Usuário pode se registrar com email, nome e senha
- [ ] Usuário pode fazer login com email e senha
- [ ] Sessão persiste por 30 dias
- [ ] Logout invalida a sessão
- [ ] Dados do usuário são carregados ao iniciar

#### Casais
- [ ] Usuário pode criar um casal gerando código de convite
- [ ] Usuário pode entrar em casal com código válido
- [ ] Casal limita-se a 2 membros
- [ ] Código de convite é único
- [ ] Usuário não pode estar em múltiplos casais

#### Transações
- [ ] CRUD completo de transações
- [ ] Filtro por contexto (individual/joint)
- [ ] Filtro por categoria
- [ ] Filtro por período (from/to)
- [ ] Paginação funcional
- [ ] Resumo mensal calculado corretamente
- [ ] Transações joint visíveis para ambos

#### Metas de Economia
- [ ] CRUD completo de metas
- [ ] Contribuições incrementam valor atual
- [ ] Status muda automaticamente ao completar
- [ ] Progresso visualizado claramente
- [ ] Metas joint compartilhadas

#### Contas
- [ ] CRUD completo de contas
- [ ] Múltiplos tipos suportados
- [ ] Saldo atualizável
- [ ] Contas inativadas (soft delete)

### Não-Funcionais

#### Performance
- [ ] Carregamento inicial < 3s
- [ ] Transições de tela < 300ms
- [ ] Lista de transações com lazy loading
- [ ] Otimização de re-renders no React

#### Segurança
- [ ] Senhas hasheadas com salt
- [ ] Tokens de sessão seguros
- [ ] CORS configurado corretamente
- [ ] Validação de entrada em todas as rotas
- [ ] Proteção contra SQL injection (Drizzle ORM)

#### Acessibilidade
- [ ] Contraste de cores adequado (WCAG AA)
- [ ] Labels em inputs
- [ ] Feedback visual de loading
- [ ] Mensagens de erro claras

#### Responsividade
- [ ] Mobile-first (320px+)
- [ ] Tablet otimizado (768px+)
- [ ] Desktop funcional (1024px+)

---

## Definição de Pronto (DoD)

Um feature é considerada **pronta** quando:

### Código
- [ ] Implementado seguindo padrões do projeto
- [ ] Tipado corretamente em TypeScript
- [ ] Validações de entrada implementadas
- [ ] Tratamento de erros adequado
- [ ] Código revisado (self-review mínimo)

### Testes
- [ ] Fluxo principal testado manualmente
- [ ] Casos de erro testados
- [ ] Edge cases considerados

### Documentação
- [ ] README atualizado (se necessário)
- [ ] Comentários em código complexo
- [ ] Tipos documentados (JSDoc se necessário)

### UX/UI
- [ ] Segue design system estabelecido
- [ ] Animações implementadas conforme spec
- [ ] Responsivo em todos os breakpoints
- [ ] Feedback visual em todas as interações

### Integração
- [ ] Backend e frontend integrados
- [ ] API calls tratam loading/error states
- [ ] Dados persistidos corretamente

### Qualidade
- [ ] Sem console.errors não tratados
- [ ] Sem warnings do TypeScript
- [ ] Sem vazamentos de memória (cleanup em effects)
- [ ] Performance aceitável (no lag perceptível)

---

## Checklist de Release

Antes de cada release, verificar:

- [ ] Todas as features DoD aprovadas
- [ ] Migrations do banco atualizadas
- [ ] Variáveis de ambiente documentadas
- [ ] README atualizado
- [ ] Versionamento semântico seguido
- [ ] Changelog atualizado (se aplicável)

---

*Última atualização: Dezembro 2024*
