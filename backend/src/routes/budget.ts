import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { monthlyBudgets, budgetCategories } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, logAudit } from '../middleware/auth'
import { nanoid } from 'nanoid'

const router = new Hono()
router.use(requireAuth)

// Schema para criação de orçamento mensal
const createBudgetSchema = z.object({
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(2020).max(2100, 'Year must be between 2020 and 2100'),
  totalBudget: z.number().positive('Total budget must be positive').max(999999.99, 'Total budget exceeds maximum allowed'),
  context: z.enum(['individual', 'joint'], { errorMap: () => ({ message: 'Context must be individual or joint' }) }),
  categories: z.array(z.object({
    category: z.enum(['dining', 'home', 'transport', 'shopping', 'health', 'travel', 'bills', 'salary', 'investment', 'other']),
    limitAmount: z.number().positive('Limit amount must be positive').max(999999.99, 'Limit amount exceeds maximum allowed'),
    alertThreshold: z.number().min(0).max(100, 'Alert threshold must be between 0 and 100').default(80.00),
  })).optional(),
})

/**
 * POST /api/budget
 * Cria um novo orçamento mensal com categorias opcionais
 */
router.post('/', zValidator('json', createBudgetSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  // Validação: usuário precisa estar em casal para criar orçamento joint
  if (body.context === 'joint' && !user.coupleId) {
    return c.json({ error: 'You must be in a couple to create joint budgets' }, 400)
  }

  // Verifica se já existe orçamento para este mês/ano/contexto
  const existingBudget = await db
    .select()
    .from(monthlyBudgets)
    .where(
      and(
        eq(monthlyBudgets.userId, user.id),
        eq(monthlyBudgets.month, body.month),
        eq(monthlyBudgets.year, body.year),
        eq(monthlyBudgets.context, body.context)
      )
    )
    .limit(1)

  if (existingBudget.length > 0) {
    return c.json({ error: 'Budget already exists for this month/year/context' }, 409)
  }

  // Cria o orçamento principal
  const [budget] = await db
    .insert(monthlyBudgets)
    .values({
      id: nanoid(),
      userId: user.id,
      coupleId: body.context === 'joint' ? user.coupleId : null,
      month: body.month,
      year: body.year,
      totalBudget: String(body.totalBudget),
      context: body.context,
    })
    .returning()

  // Cria as categorias se fornecidas
  let categories = []
  if (body.categories && body.categories.length > 0) {
    const categoryValues = body.categories.map(cat => ({
      id: nanoid(),
      budgetId: budget.id,
      category: cat.category,
      limitAmount: String(cat.limitAmount),
      alertThreshold: String(cat.alertThreshold ?? 80.00),
      spentAmount: '0',
    }))

    categories = await db
      .insert(budgetCategories)
      .values(categoryValues)
      .returning()
  }

  // Log de auditoria
  await logAudit(
    user.id,
    'create',
    'monthly_budget',
    budget.id,
    null,
    { 
      month: body.month, 
      year: body.year, 
      totalBudget: body.totalBudget, 
      context: body.context,
      categories: body.categories 
    },
    c.req.header('X-Forwarded-For'),
    c.req.header('User-Agent')
  )

  return c.json({ data: { budget, categories } }, 201)
})

export default router
